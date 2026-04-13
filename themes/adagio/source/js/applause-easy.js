class ApplauseEasy {
  constructor(app) {
    let appId = app.appId
    let appKey = app.appKey
    if (typeof AV !== 'undefined' && AV.applicationId) {
      console.log(
        'LeanCloud SDK already initialized, skipping...',
      )
      // 使用已初始化的AV实例
      this.setupApplaud(app)
      return
    }
    if (!AV) {
      console.log('AV module is not registered.')
    }
    try {
      AV.init({ appId, appKey })
      this.setupApplaud(app)
    } catch (err) {
      console.log(err)
    }
  }

  setupApplaud(app) {
    let id = app.id
    let img_src = app.img_src
    let img_width = app.img_width
    let img_height = app.img_height
    let trigger_every = app.trigger_every
    let trigger_fun = app.trigger_fun
    let counter = 0
    let key = this.getKey(id)
    let browserCounter = 0
    let hasThanks = false
    document.getElementById(id).innerHTML =
      `<div class="applause-number"><span id="${id + '-num'}">0</span><span>次很棒</span></div>
            <div class="applause-container">
                <div class="applause-wrapper">
                <img id="${id + '-btn'}" src="${img_src}" style="width: ${img_width}; height: ${img_height}; "/>
                </div>
            </div>`

    function run() {
      updateRemote(key, browserCounter)
      counter += browserCounter
      browserCounter = 0
      hasThanks = false
    }
    const activeRun = this.debounce(run, 300)
    document
      .getElementById(id + '-btn')
      .addEventListener('click', function () {
        let numDOM = document.getElementById(id + '-num')
        numDOM.innerHTML = parseInt(numDOM.innerHTML) + 1
        browserCounter += 1
        if (!hasThanks && browserCounter > trigger_every) {
          trigger_fun()
          hasThanks = true
        }
        activeRun()
      })

    let fetchRemote = function (key, id) {
      let Applause = AV.Object.extend('Applause')
      let query = new AV.Query('Applause')
      query.equalTo('key', key)
      query.first().then(
        function (applause) {
          if (applause) {
            let target = applause.attributes.counter
            let targetStr = target.toString()
            let dom = document.getElementById(id + '-num')
            let digits = targetStr.length
            dom.innerHTML = Array(digits).fill('0').join('')
            let i = 0
            let fastIncrease = setInterval(function () {
              let currentHTML = dom.innerHTML
              if (currentHTML[i] < targetStr[i]) {
                let newNum = parseInt(currentHTML[i]) + 1
                dom.innerHTML =
                  currentHTML.substring(0, i) +
                  newNum.toString() +
                  currentHTML.substring(i + 1, digits)
              } else {
                i += 1
                if (i >= digits) {
                  clearInterval(fastIncrease)
                }
              }
            }, 50)
          } else {
            let applause = new Applause()
            applause.set('key', key)
            applause.set('counter', 0)
            applause.save().then(
              function () {
                console.log('Creation successful.' + key)
              },
              function (err) {
                console.log(err)
              },
            )
          }
        },
        function (err) {
          console.log(err)
        },
      )
    }

    fetchRemote(key, id)

    let updateRemote = function (key, step) {
      let query = new AV.Query('Applause')
      console.log('query', query)
      query.equalTo('key', key)
      query.first().then(
        function (applause) {
          if (applause) {
            applause.increment('counter', step)
            applause.save().then(
              function () {
                console.log(
                  `Applause at key ${key} increased by ${step} successfully.`,
                )
              },
              function (err) {
                console.log(err)
              },
            )
          }
        },
        function (err) {
          console.log(err)
        },
      )
    }
  }

  getKey(id) {
    let pathname = window.location.pathname
    if (pathname.includes('/page/')) {
      pathname = '/'
    }
    return pathname + '#' + id
  }
  /**
   * 防抖函数
   * @param {Function} func 需要防抖的函数
   * @param {number} delay 延迟时间（毫秒）
   * @returns {Function} 返回防抖后的函数
   */
  debounce(func, delay = 300, flag = null) {
    let timer = null

    return function (...args) {
      // 如果已有定时器存在，则清除之前的定时器
      if (timer) clearTimeout(timer)

      // 重新设置定时器
      timer = setTimeout(() => {
        func.apply(flag || this, args) // 确保正确的 this 上下文
        timer = null
      }, delay)
    }
  }
}
