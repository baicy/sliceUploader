import axios from 'axios'

const handleErrorStatus = (error) => {
  // console.log('error', error)
  // console.log('error.message', error.message)
  // console.log('error.response', error.response)
}

const configAxios = (config) => {
  const service = axios.create({
    baseURL: '/api',
    timeout: 5000
  })

  service.interceptors.response.use(
    response => response.data,
    error => {
      handleErrorStatus(error)
      return Promise.reject(error)
    }
  )

  return service(config)
}

export const request = (path, params={}) => {
  return configAxios({
    method: 'post',
    url: path,
    data: params
  })
}
