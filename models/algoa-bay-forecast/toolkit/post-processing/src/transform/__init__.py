from email.policy import default
import xarray as xr
import numpy as np
from datetime import timedelta, datetime
from os import path
from transform.depth_functions import z_levels
import optparse
#from config import NC_INPUT_PATH, GRID_PATH, NC_OUTPUT_PATH

# Importing file paths from bash script bin/exe
p = optparse.OptionParser()
p.add_option('--NC_OUTPUT_PATH', '-o', default="./")
p.add_option('--NC_INPUT_PATH', '-i', default="./input.nc")
p.add_option('--GRID_INPUT_PATH', '-g', default="./grd.nc")
options, arguments = p.parse_args()

#Setting the paths using the bash input 
NC_OUTPUT_PATH = options.NC_OUTPUT_PATH
NC_INPUT_PATH = options.NC_INPUT_PATH
GRID_INPUT_PATH = options.GRID_INPUT_PATH

print(options.NC_OUTPUT_PATH)
print(options.NC_INPUT_PATH)

# All dates in the CROCO output are represented
# in seconds from 1 Jan 2000 (i.e. the reference date)
REFERENCE_DATE = datetime(2000, 1, 1, 0, 0, 0)

# Rounds to nearest hour by adding a timedelta hour if minute >= 30
def hour_rounder(t):
    return (t.replace(second=0, microsecond=0, minute=0, hour=t.hour) + timedelta(hours=t.minute//30))

# Converts the v current component to the correct (rho) grid
def v2rho_4d(var_v):
      [T,D,M,Lp]=var_v.shape
      var_rho=np.zeros((T,D,M+1,Lp))
      var_rho[:,:,1:M-1,:]=0.5*np.squeeze([var_v[:,:,0:M-2,:]+var_v[:,:,1:M-1,:]])
      var_rho[:,:,0,:]=var_rho[:,:,1,:]
      var_rho[:,:,M,:]=var_rho[:,:,M-1,:]
      return var_rho

# Converts the u current component to the correct (rho) grid
def u2rho_4d(var_u):
      [T,D,Mp,L]=var_u.shape
      var_rho=np.zeros((T,D,Mp,L+1))
      var_rho[:,:,:,1:L-1]=0.5*np.squeeze([var_u[:,:,:,0:L-2]+var_u[:,:,:,1:L-1]])
      var_rho[:,:,:,0]=var_rho[:,:,:,1]
      var_rho[:,:,:,L]=var_rho[:,:,:,L-1]
      return var_rho

# Model variables use the dimesions time (time from reference date),
# eta_rho (lat) and xi_rho (lon). We are changing eta_rho and xi_rho 
# from grid pionts to real lat and lon data.

def transform():
    data = xr.open_dataset(NC_INPUT_PATH)
    data_grid = xr.open_dataset(GRID_INPUT_PATH)
    #print(data)

    # Dimensions that need to be transformed
    time = data.time.values
    lon_rho = data.lon_rho.values
    lat_rho = data.lat_rho.values
    s_rho = data.s_rho.values

    # Convert time to human readable 
    dates = []
    for t in time:
        date_now = REFERENCE_DATE + timedelta(seconds=np.float64(t))
        date_round = hour_rounder(date_now)
        dates.append(date_round)

    # Variables used in the visualtions
    temperature = data.temp.values
    salt = data.salt.values
    ssh = data.zeta.values
    u = data.u.values
    v = data.v.values

    #Variables used to calculate depth levels
    theta_s = data.theta_s
    theta_b = data.theta_b

    #Variables used to calculate depth levels from grid (bathmetry)
    h = data_grid.h.values

    # Convert u and v current components to the rho grid
    # use the function u2rho_4d and v2rho_4d
    u_rho = u2rho_4d(u)
    v_rho = v2rho_4d(v)

    # Replace temperatures = 0 celsius with nan
    # In this dataset a temperature of 0 is representative
    # of a grid location that is not water (over land)
    temperature[np.where(temperature == 0)] = np.nan
    salt[np.where(salt == 0)] = np.nan
    u[np.where(u == 0)] = np.nan
    v[np.where(v == 0)] = np.nan

    # Variables hard coded set during model configuration
    # Relative to each model 
    hc = 200
    N = np.shape(data.s_rho)[0]
    type_coordinate = 'rho'
    vtransform = 2

    # m_rho refers to the depth level in meters
    m_rho = np.zeros(np.shape(temperature))

    for x in np.arange(np.size(temperature,0)):    
        depth_temp = z_levels(h,ssh[x,:,:],theta_s,theta_b,hc,N,type_coordinate,vtransform)
        m_rho[x,::] = depth_temp

    # Create new xarray dataset with selected variables 
    data_out = xr.Dataset(
        data_vars=dict(
            temperature=(["time","depth","lat", "lon"], temperature[:,:,:,:]),
            salt=(["time","depth","lat", "lon"], salt[:,:,:,:]),
            u=(["time","depth","lat", "lon"], u_rho[:,:,:,:]),
            v=(["time","depth","lat", "lon"], v_rho[:,:,:,:]),
            m_rho= (["time","depth","lat","lon"],m_rho)

        ),
        coords=dict(
            lon_rho=(["lat", "lon"], lon_rho),
            lat_rho=(["lat", "lon"], lat_rho),
            depth=s_rho,
            time=dates,
        ),
        attrs=dict(description="CROCO output from algoa Bay model transformed lon/lat/depth/time"),
    )

    #Print output 
    output = path.join(NC_OUTPUT_PATH)
    data_out.to_netcdf(output)
    print(data_out)