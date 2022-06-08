import React, { useEffect, memo } from 'react'
import ReactDOM from 'react-dom'
import { styled } from '@mui/material/styles'
import { Box, Divider, Grid, Typography, Button } from '@mui/material'
import { request } from '../utils/request'

const PreviewBox = styled(Box)({
    border: '1px solid grey',
    textAlign: 'left',
    padding: '10px',
    marginTop: '10px',
    marginLeft: '10px',
  })

const FilePreviewer = ({ file }) => {
    console.log('render previewer')
    useEffect(() => {
        // console.log('file preview', file)
    }, [file])
    const handlerDownloadFile = (e, file) => {
        e.preventDefault()
        const { name: fileName, md5 } = file
        request(`/download/${md5}`, { fileName, md5 }, { responseType: 'blob' })
        .then(
          (res) => {
            const { data, fileName } = res
            const blob = new Blob([data], { type: data.type })
            const url = window.URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = decodeURIComponent(fileName)
            link.click()
            window.URL.revokeObjectURL(url)
          },
          (err) => console.log(err)
        )
      }

    return ReactDOM.createPortal(<PreviewBox>
        <Grid container>
            <Grid item xs={8}>
                <Typography variant="h6">{ file && file.name }</Typography>
            </Grid>
            <Grid item xs={4} style={{ textAlign: 'right' }}>
                <Button onClick={(e)=>handlerDownloadFile(e, file)}>DOWNLOAD</Button>
            </Grid>
        </Grid>
        <Divider></Divider>
    </PreviewBox>, document.getElementById('previewer'))
}

export default memo(FilePreviewer)