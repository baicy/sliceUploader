import React from 'react'
import { styled } from '@mui/material/styles'
import LoadingButton from '@mui/lab/LoadingButton'
import UploadIcon from '@mui/icons-material/Upload'

const Input = styled('input')({
  display: 'none',
})

const UploadButton = ({ onChange, loading }) => {
  return (
    <>
      <label htmlFor="contained-button-file">
        <Input accept="*/*" id="contained-button-file" type="file" onChange={onChange} />
        <LoadingButton
          variant="contained"
          component="span"
          startIcon={<UploadIcon />}
          loading={loading}
          loadingPosition="start"
        >
          Upload
        </LoadingButton>
      </label>
    </>
  )
}

export default UploadButton
