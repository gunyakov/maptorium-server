let stat = {
  general: {
    download: 0,
    error: 0,
    empty: 0,
    size: 0,
    skip: 0,
    queue: 0
  },
  job: {
    total: 0,
    download: 0,
    error: 0,
    empty: 0,
    size: 0,
    skip: 0,
    queue: 0,
    time: 0
  },
  generate: {
    total: 0,
    procesed: 0,
    skip: 0
  },
  updated: false
}

module.exports = stat;
