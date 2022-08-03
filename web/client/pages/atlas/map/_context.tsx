import { createContext, useEffect, useRef, useContext, useState } from 'react'
import SceneView from '@arcgis/core/views/SceneView'
import Map from '@arcgis/core/Map'
import esriConfig from '@arcgis/core/config'
import VectorTileLayer from '@arcgis/core/layers/VectorTileLayer'
import { ctx as configContext } from '../../../modules/config'
import useTheme from '@mui/material/styles/useTheme'
import Div from '../../../components/div'
import Span from '../../../components/span'
import maplibre from 'maplibre-gl'
import Typography from '@mui/material/Typography'
import { alpha } from '@mui/system/colorManipulator'

const Attribution = () => {
  return (
    <Typography
      variant="caption"
      sx={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: theme => alpha(theme.palette.common.white, 0.5),
        m: theme => theme.spacing(0),
        p: theme => theme.spacing(0.5),
        zIndex: 1,
        fontSize: 12,
      }}
    >
      <Span
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        Powered by Esri
      </Span>
    </Typography>
  )
}

export const ctx = createContext(null)

export default ({ children }) => {
  const { TILESERV_BASE_URL, ESRI_API_KEY, NODE_ENV } = useContext(configContext)
  const theme = useTheme()
  const ref = useRef(null)
  const mapRef = useRef(null)
  const ESRI_BASEMAP = 'arcgis-terrain'

  useEffect(() => {
    esriConfig.apiKey = ESRI_API_KEY

    const metadata = new VectorTileLayer({
      style: {
        id: 'metadata',
        version: 8,
        sources: {
          models: {
            type: 'vector',
            tiles: [`${TILESERV_BASE_URL}/public.metadata/{z}/{x}/{y}.pbf`],
          },
        },
        layers: [
          {
            id: 'model-metadata',
            type: 'fill',
            source: 'models',
            minzoom: 0,
            maxzoom: 24,
            'source-layer': 'public.metadata',
            paint: {
              'fill-color': theme.palette.primary.dark,
              // 'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.6, 0.2],
              'fill-opacity': 0.2,
              'fill-outline-color': theme.palette.primary.dark,
            },
          },
        ],
      },
    })

    const map = new Map({
      basemap: ESRI_BASEMAP,
      layers: [metadata],
    })

    const view = new SceneView({
      map,
      center: [25, -31],
      zoom: 6,
      container: ref.current,
    })

    if (NODE_ENV !== 'production') {
      window.map = map
      window.view = view
    }

    // map.on('load', () => {
    //   map.addSource('metadata', {
    //     type: 'vector',
    //     tiles: [`${TILESERV_BASE_URL}/public.metadata/{z}/{x}/{y}.pbf`],
    //     url: `${TILESERV_BASE_URL}/public.metadata.json`,
    //     promoteId: 'id',
    //   })

    //   map.addLayer({
    //     id: 'models',
    //     type: 'fill',
    //     source: 'metadata',
    //     'source-layer': 'public.metadata',
    // paint: {
    //   'fill-color': theme.palette.primary.dark,
    //   'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.6, 0.2],
    //   'fill-outline-color': theme.palette.primary.dark,
    // },
    //   })

    //   let featureHoveredId = null
    //   map.on('mouseenter', 'models', ({ features }) => {
    //     featureHoveredId = features[0].id
    //     map.getCanvas().style.cursor = 'pointer'
    //     map.setFeatureState(
    //       { source: 'metadata', id: featureHoveredId, sourceLayer: 'public.metadata' },
    //       { hover: true }
    //     )
    //   })

    //   map.on('mouseleave', 'models', () => {
    //     map.getCanvas().style.cursor = ''
    //     map.setFeatureState(
    //       { source: 'metadata', id: featureHoveredId, sourceLayer: 'public.metadata' },
    //       { hover: false }
    //     )
    //   })

    //   map.on('click', 'models', ({ features: [feature] }) => {
    //     const { min_x, min_y, max_x, max_y } = feature.properties
    //     const center = [min_x + (max_x - min_x) / 2, min_y + (max_y - min_y) / 2]
    //     map.fitBounds(
    //       [
    //         [min_x, max_y],
    //         [max_x, min_y],
    //       ],
    //       {
    //         linear: false,
    //         padding: 48,
    //         curve: 1,
    //         speed: 1.5,
    //       }
    //     )
    //   })
    // })
  }, [])

  return (
    <ctx.Provider value={{ map: mapRef.current }}>
      {children}
      <Div
        ref={ref}
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        <Attribution />
      </Div>
    </ctx.Provider>
  )
}
