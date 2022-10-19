import { useContext } from 'react'
import { context as modelContext } from '../../_context'
import Slider from '@mui/material/Slider'
import IconButton from '@mui/material/IconButton'
import { SigmaLower } from '../../../../../../components/icons'
import Tooltip from '@mui/material/Tooltip'

export const ToggleDepth = () => {
  const { activeRightPane, setActiveRightPane } = useContext(modelContext)
  return (
    <Tooltip placement="left-start" title="Toggle depth control pane">
      <IconButton
        size="small"
        color="primary"
        onClick={() => setActiveRightPane(a => (a === 'depth' ? false : 'depth'))}
      >
        <SigmaLower
          sx={{
            color: theme => (activeRightPane === 'depth' ? theme.palette.success.dark : 'primary'),
          }}
          fontSize="small"
        />
      </IconButton>
    </Tooltip>
  )
}

const marks = [
  {
    value: -500,
    label: '500',
  },
  {
    value: -200,
    label: '200',
  },

  {
    value: -100,
    label: '100',
  },

  {
    value: -50,
    label: '50',
  },

  {
    value: -25,
    label: '25',
  },

  {
    value: 0,
    label: 'S',
  },
]

export default () => {
  const { setDepth, activeRightPane } = useContext(modelContext)

  const isIn = activeRightPane === 'depth'

  return (
    <Slider
      sx={{
        '& .MuiSlider-mark': {
          height: '1px',
          width: '12px',
        },
      }}
      aria-label="Depth level"
      defaultValue={0}
      size="small"
      scale={x => x}
      min={marks[0].value}
      max={marks[marks.length - 1].value}
      orientation="vertical"
      step={null}
      onChangeCommitted={(_, val) => setDepth(val)}
      valueLabelDisplay="off"
      marks={marks}
      track={false}
    />
  )
}