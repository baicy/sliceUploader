import React, { memo, useMemo, useContext, useCallback } from 'react'
import { Box, Stack, Typography, Link, LinearProgress, CircularProgress } from '@mui/material'
import ErrorIcon from '@mui/icons-material/Error'
import { UploaderContext } from './SliceUploader'

const FileItem = memo(({ file }) => {
  // TODO: 点击preview时不重新渲染文件列表
  console.log('render file', file.name)
  const dispatch = useContext(UploaderContext)

  const handlerPreview = useCallback((e)=>{
    e.preventDefault()
    // console.log(file.name)
    dispatch({ type: 'filePreview', file })
  }, [])

  return (
    <Box>
      <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 1 }}>
        <Box sx={{ display: 'flex', width: '100%' }}>
          {['checking', 'uploading'].includes(file.status) && <CircularProgress size={15} />}
          {['error'].includes(file.status) && <ErrorIcon color="error" sx={{ fontSize: 18 }} />}
          {file.status === 'uploaded' ? (
            <Link href="#" underline="none" onClick={handlerPreview}>
              {file.name}
            </Link>
          ) : (
            <Typography variant="body" color={file.status === 'error' ? 'error' : 'text'} sx={{ ml: '8px' }}>
              {file.name}
            </Typography>
          )}
        </Box>
        {file.percent >= 0 && file.percent < 100 && (
          <Box>
            <Typography variant="body2" color={file.status === 'error' ? 'error' : 'text.secondary'}>
              {`${file.percent}%`}
            </Typography>
          </Box>
        )}
      </Box>
      {['checking', 'uploading'].includes(file.status) ? (
        <Box sx={{ width: '100%' }}>
          <LinearProgress variant="determinate" value={file.percent} sx={{ height: 2 }} />
        </Box>
      ) : (
        <Box sx={{ height: 2 }}></Box>
      )}
    </Box>
  )
})

const FileList = memo(({ files }) => {
  const list = useMemo(()=>([...files]), [files])
  console.log('render file list')

  return <>
    {list.map((item) => <FileItem key={`${item.md5}-${encodeURIComponent(item.name)}`} file={item} />)}
  </>
})

const UploadList = ({ currentFile, uploadedFiles }) => {

  console.log('render list')

  const files = useMemo(()=>[...uploadedFiles], [uploadedFiles])

  return (
    <>
      <Stack spacing={2}>
        {currentFile && <FileItem file={{ ...currentFile, status: currentFile.percent ? 'uploading' : 'checking' }} />}
        { files.length > 0 && <FileList files={files} />}
      </Stack>
    </>
  )
}

export default memo(UploadList)
