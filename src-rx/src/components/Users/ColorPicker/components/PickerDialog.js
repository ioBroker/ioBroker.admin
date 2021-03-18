import React from 'react'
import PropTypes from 'prop-types'
import { ChromePicker } from 'react-color'

const PickerDialog = ({
  value,
  onClick,
  onChange,
  className
}) => (
  <div style={{ position: 'relative' }}>
    <div style={{ position: 'absolute', zIndex: '2' }}>
      <div
        style={{ position: 'fixed', top: '0px', right: '0px', bottom: '0px', left: '0px' }}
        onClick={onClick}
      />
      <ChromePicker
        color={value}
        onChange={onChange}
        className={className}
      />
    </div>
  </div>
)

PickerDialog.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.any
}

export default PickerDialog
