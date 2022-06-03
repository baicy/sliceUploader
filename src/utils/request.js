import axios from 'axios'

const configAxios = (config) => {
  const service = axios.create({
    baseURL: '/api',
    timeout: 5000
  })

  service.interceptors.response.use(
    response => response.data,
    error => error.message
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
