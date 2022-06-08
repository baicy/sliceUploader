const previewAreaId = 'previewArea'
const previewItemId = 'previewItem'

const display = (ele) => {
  const previewArea = document.getElementById(previewAreaId)
  const old = document.getElementById(previewItemId)
  old && previewArea.removeChild(old)

  if(!ele) return

  ele.id = previewItemId
  ele.style.width = '100%'
  previewArea.appendChild(ele)
}

const getDefaultHeight = () => window.innerHeight - 10 - 2 - 20 - 40 - 20

const handlerDefault = () => {
  const div = document.createElement('div')

  div.innerHTML = '暂无预览'
  div.style.height = `${getDefaultHeight()}px`
  div.style.textAlign = 'center'
  div.style.lineHeight = div.style.height
  div.style.backgroundColor = '#999'
  div.style.color = '#fff'
  div.style.fontSize = '30px'

  display(div)
}

const handlerImage = (file) => {
  const img = new Image()
  img.src = file.url
  img.style.objectFit = 'contain'
  img.style.objectPosition = '0%'
  img.style.minHeight = '300px'
  img.onload = () => {
    img.style.height = `${Math.min(getDefaultHeight(), img.height)}px`
    display(img)
  }
}

const handlerPDF = (file) => {
  const iframe = document.createElement('iframe')
  iframe.src = file.url
  iframe.style.border = 'none'
  iframe.style.height = `${getDefaultHeight()}px`

  display(iframe)
}

const handlerVideo = (file) => {
  const video = document.createElement('video')
  video.src = file.url
  video.controls = 'controls'
  video.onloadeddata = () => {
    display(video)
  }
}

const handlerText = (file) => {
  const reader = new FileReader()
  reader.readAsText(file.blob)
  reader.onload = () => {
    const text = document.createElement('pre')
    text.innerHTML = reader.result
    text.style.height = `${getDefaultHeight()}px`
    text.style.overflow = 'auto'
    text.style.margin = 0
    display(text)
  }

}

const handlerExcel = (file) => {
  handlerDefault()
}

const typeMap = {
  image: ['image/png', 'image/jpeg', 'image/gif'],
  pdf: ['application/pdf'],
  video: ['video/mp4'],
  txt: ['text/plain', 'text/markdown'],
  excel: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
}

const methodMap = {
  image: handlerImage,
  pdf: handlerPDF,
  video: handlerVideo,
  txt: handlerText,
  excel: handlerExcel
}

export const preview = (file) => {
  let type = ''
  for(let i in typeMap) {
    if(typeMap[i].includes(file.fileType)) {
      if(methodMap[i]) {
        type = i
        methodMap[i](file)
      }
      break
    }
  }
  if(!type) {
    console.log('unsettle type: ',file.fileType)
    handlerDefault()
  }
}
