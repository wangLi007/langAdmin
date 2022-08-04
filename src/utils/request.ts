import axios from 'axios';

const request = axios.create({
  baseURL: "http://119.23.152.30/", // url = base url + request url
  timeout: 30000
})

request.interceptors.request.use(
  config => {
    return config;
  },
  error => {
    console.log(error); // for debug
    return Promise.reject(error);
  }
)

// interface Iresponse {
//   data: any,
//   code: number
// }

// response interceptor
request.interceptors.response.use(
  (response) => {
    // const res = response.data;
    return response.data
  },
  error => {
    console.log('err' + error) // for debug
    return Promise.reject(error)
  }
)

export default request;