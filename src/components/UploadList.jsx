import React from 'react'
import Box from '@mui/material/Box'
import Stack from '@mui/material/Stack'
import Typography from '@mui/material/Typography'
import Link from '@mui/material/Link'
import LinearProgress from '@mui/material/LinearProgress'
import CircularProgress from '@mui/material/CircularProgress'
import ErrorIcon from '@mui/icons-material/Error'

const FileItem = ({ file }) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', width: '100%' }}>
          { ['checking', 'uploading'].includes(file.status) && <CircularProgress size={15} />}
          { ['error'].includes(file.status) && <ErrorIcon color="error" sx={{ fontSize: 18 }} />}
          {
            file.status==='uploaded' ?
              <Link href="#" underline="none">{ file.name }</Link> :
              <Typography variant="body" color={file.status==='error'?'error':'text'} sx={{ ml: '8px' }}>{ file.name }</Typography>
          }
        </Box>
        {
          file.percent>=0 && file.percent<100 && <Box>
            <Typography variant="body2" color={file.status==='error'?'error':'text.secondary'}>
              { `${file.percent}%` }
            </Typography>
          </Box>
        }
      </Box>
      {
        ['checking', 'uploading'].includes(file.status) ?
          <Box sx={{ width: '100%' }}>
            <LinearProgress variant="determinate" value={file.percent} sx={{ height: 2 }} />
          </Box> : <Box sx={{ height: 2 }}></Box>
      }
    </Box>
  )
}

const UploadList = ({ currentFile, uploadedFiles }) => {
  return (
    <>
      <Stack spacing={2}>
        { currentFile && <FileItem file={{...currentFile, status: currentFile.percent?'uploading':'checking'}} /> }
        {
          uploadedFiles.length > 0 && uploadedFiles.map((item) => (
            <FileItem key={item.md5} file={item} />
          ))
        }
      </Stack>
    </>
  )
}

export default UploadList
