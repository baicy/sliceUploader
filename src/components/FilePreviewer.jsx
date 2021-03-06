import React, { useEffect, memo, useState, useContext } from 'react'
import ReactDOM from 'react-dom'
import { styled } from '@mui/material/styles'
import { Box, Paper, Divider, Grid, Typography, Button } from '@mui/material'
import { request } from '../utils/request'
import { preview } from '../utils/preview'
import { UploaderContext } from './SliceUploader'

const PreviewBox = styled(Paper)({
  textAlign: 'left',
  padding: '10px',
  marginTop: '10px',
  marginLeft: '10px',
})

const FilePreviewer = ({ file }) => {
  const [fileData, setFileData] = useState(null)

  const dispatch = useContext(UploaderContext)

  // console.log('render previewer')

  useEffect(() => {
    const { name: fileName, md5 } = file
    request(`/download`, { fileName, md5 }, { responseType: 'blob' }).then(
      (res) => {
        const { data, fileName } = res
        const blob = new Blob([data], { type: data.type })
        const url = window.URL.createObjectURL(blob)
        const previewFile = { blob, url, md5, fileName: decodeURIComponent(fileName), fileType: data.type }
        setFileData(previewFile)
        preview(previewFile)
      },
      (err) => console.log(err)
    )
    return () => {
      fileData && fileData.url && window.URL.revokeObjectURL(fileData.url)
    }
  }, [file])

  const handlerDownloadFile = (e) => {
    e.preventDefault()
    const link = document.createElement('a')
    link.href = fileData.url
    link.download = decodeURIComponent(fileData.fileName)
    link.click()
  }

  const handlerDeleteFile = (e) => {
    e.preventDefault()
    const { md5, fileName } = fileData
    request(`/delete`, { md5, fileName }).then(
      () => {
        dispatch({ type: 'fileDeleted' })
        request('/test').then(list => {
          dispatch({ type: 'filesLoaded', list })
        })
      },
      (err) => console.error(err)
    )
  }

  return ReactDOM.createPortal(
    <PreviewBox variant="outlined" square>
      <Grid container>
        <Grid item xs={8}>
          <Typography variant="h6">{file && file.name}</Typography>
        </Grid>
        <Grid item xs={4} style={{ textAlign: 'right' }}>
          <Button onClick={handlerDownloadFile}>DOWNLOAD</Button>
          <Button onClick={handlerDeleteFile} color="error">REMOVE</Button>
        </Grid>
      </Grid>
      <Divider sx={{ mb: '10px' }}></Divider>
      <Box id="previewArea"></Box>
    </PreviewBox>,
    document.getElementById('previewer')
  )
}

export default memo(FilePreviewer)
