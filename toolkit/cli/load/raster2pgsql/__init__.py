from curses.ascii import NUL
import os
from re import sub
from postgis import connect as connectPg
from yaml import Loader, load
from datetime import datetime
from config import PG_DB, PG_HOST, PG_PASSWORD, PG_PORT, PG_USERNAME, RELOAD_EXISTING_DATA, PY_ENV

def register(now, nc_input_path, raster, model):
  print('\n->', raster, str(datetime.now() - now))
  p, filename =  os.path.split("""{0}:{1}""".format(str(nc_input_path), str(raster)))

  """
  Config is to define how to split raster bands into smaller tiles
  when inserting into PostGIS
  """
  config = NUL
  with open('cli/load/raster2pgsql/models.yml') as file:
    config = load(file, Loader)['models']
    if not config[model]: raise Exception('No raster2pgsql configuration for model', model)
    if not config[model][raster]: raise Exception('No raster2pgsql configuration for model', model, 'variable', raster)

  """
  raster2pgsql -t auto value defaults to the grid size (156x106) which
  is too large for in-db rasters. This seems to work with out-db rasters,
  but regardless it's probably more performant to work with smaller tile
  sizes. However, the tile sizes then need to be set explicitly for each
  variable
  """
  tileDimensions = config[model][raster]['tile_size']
  if not tileDimensions:
    raise Exception('Tile dimensions not specified for', raster, 'Please update this in the source code manually above')

  """
  There are good reasons to reload from a file input, for example if the
  file was recreated by rerunning the model. However in development this
  is very slow (unless an out-db raster solution is used in the future).
  This is only for development
  """
  if not RELOAD_EXISTING_DATA:
    if not PY_ENV == 'development':
      raise Exception('In production mode, raster data is ALWAYS re-inserted to the DB')
    else:
      cursor = connectPg().cursor()
      cursor.execute("""
        select 1 where exists ( select * from public.rasters where filename = %s )
      """, (filename, ))
      exists = not len(cursor.fetchall()) == 0
      if exists:
        print('skipping (raster already exists in DB)')
        return

  """
  In case this function is re-run from the same input file, first delete
  previous input from that file (otherwise there will be duplicate raster).
  So far as I'm aware there is no way to check uniqueness of rasters loaded
  via raster2pgsql. This query should never fail as the table should be created
  as part of the DDL specification (schema.sql)
  """
  connectPg().cursor().execute("""
    delete from public.rasters where filename = %s
  """, (filename, ))

  """
  Load rasters into the DB. In the future it may be useful to have
  out-db rasters, so the flag is left here as a stub. Note that the
  srid is set to 0 (-s 0) as the grid is not geobounded, but instead
  integer based.
  """
  out_db_flag = ''
  cmd = """
    raster2pgsql \
      -a \
      -q \
      -t {0} \
      -F \
      -s 0 \
      {1} \
      NETCDF:"{2}":{3} \
      public.rasters \
      | psql \
        postgres://{4}:{5}@{6}:{7}/{8}""".format(
          str(tileDimensions),
          str(out_db_flag),
          str(nc_input_path),
          str(raster),
          str(PG_USERNAME),
          str(PG_PASSWORD),
          str(PG_HOST),
          str(PG_PORT),
          str(PG_DB)
        )
      
  print("""Command:""".format(str(raster)), sub(' +', ' ', cmd))
  if os.system(cmd) != 0: raise Exception('raster2pgsql cmd failed: ' + sub(' +', ' ', cmd))

  """
  Explicitly associate individual rasters with a model
  """
  with open('cli/load/raster2pgsql/update-raster_xref_model.sql') as file:
    sql = file.read()
    cursor = connectPg().cursor()
    cursor.execute(sql, (filename, model,))
    print(cursor.statusmessage)
  