/**
 * 并发执行并返回所有promise执行情况
 * @param {number} limit 并发数目
 * @param {iterable} iterable 执行的参数
 * @param {Promise} iteratorFn 执行的函数
 * @returns Promise
 */
const concurrency = async (limit, iterable, iteratorFn) => {
  const promises = []
  const executing = new Set()
  for(const item of iterable) {
    const p = Promise.resolve().then(() => iteratorFn(item, iterable))
    promises.push(p)
    executing.add(p)
    const clean = () => executing.delete(p)
    p.then(clean).catch(clean)
    if(executing.size>=limit) {
      await Promise.race(executing)
    }
  }
  return Promise.allSettled(promises).then((results) => {
    return new Promise((resolve, reject) => {
      const resolves = results.filter(r=>r.status==='fulfilled'), rejects = results.filter(r=>r.status==='rejected')
      if(rejects.length) {
        reject({ resolves, rejects })
      } else {
        resolve(resolves)
      }
    })
  })
}

export default concurrency
