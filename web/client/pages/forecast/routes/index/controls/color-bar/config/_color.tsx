import { useRef, useEffect } from 'react'
import * as d3 from 'd3'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import ListSubheader from '@mui/material/ListSubheader'
import Canvas from '../../../../../../../components/canvas'

// https://observablehq.com/@d3/color-schemes

export default (name, min, max) =>
  d3.scaleSequential(d3[`interpolate${name}`]).domain(d3.extent([min || 10, max || 25], v => v))

export const presets = {
  'Sequential (Single-Hue)': [
    'Blues',
    //  'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'
  ],
  'Sequential (Multi-Hue)': [
    'BuGn',
    'BuPu',
    'GnBu',
    'OrRd',
    'PuBuGn',
    'PuBu',
    'PuRd',
    'RdPu',
    'YlGnBu',
    'YlGn',
    'YlOrBr',
    'YlOrRd',
    'Cividis',
    'Viridis',
    'Inferno',
    'Magma',
    'Plasma',
    'Warm',
    'Cool',
    'CubehelixDefault',
    'Turbo',
  ],
  Diverging: ['BrBG', 'PRGn', 'PiYG', 'PuOr', 'RdBu', 'RdGy', 'RdYlBu', 'RdYlGn', 'Spectral'],
  Cyclical: ['Rainbow', 'Sinebow'],
}

export const SelectControl = ({ colorScheme, setColorScheme }) => {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    window.test = canvas
  })

  return (
    <Select
      size="small"
      IconComponent={null}
      labelId="select-color-label"
      id="select-color"
      value={colorScheme}
      label="Colors"
      renderValue={value => value}
      onChange={({ target: { value } }) => setColorScheme(value)}
    >
      <ListSubheader>Sequential (Single-Hue)</ListSubheader>
      {presets['Sequential (Single-Hue)'].map(value => {
        return (
          <MenuItem
            key={value}
            value={value}
            sx={{ backgroundColor: 'transparent', height: theme => theme.spacing(4) }}
          >
            <canvas ref={ref} style={{ width: '100%', height: '100%', border: '1px solid red' }} />
          </MenuItem>
        )
      })}
      <ListSubheader>Sequential (Multi-Hue)</ListSubheader>
      {presets['Sequential (Multi-Hue)'].map(value => (
        <MenuItem
          key={value}
          value={value}
          sx={{ backgroundColor: 'transparent', height: theme => theme.spacing(4) }}
        >
          {value}
        </MenuItem>
      ))}
      <ListSubheader>Diverging</ListSubheader>
      {presets['Diverging'].map(value => (
        <MenuItem
          key={value}
          value={value}
          sx={{ backgroundColor: 'transparent', height: theme => theme.spacing(4) }}
        >
          {value}
        </MenuItem>
      ))}
      <ListSubheader>Cyclical</ListSubheader>
      {presets['Cyclical'].map(value => (
        <MenuItem
          key={value}
          value={value}
          sx={{ backgroundColor: 'transparent', height: theme => theme.spacing(4) }}
        >
          {value}
        </MenuItem>
      ))}
    </Select>
  )
}
