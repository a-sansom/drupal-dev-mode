const EventEmitter = require('events')

class DevModeEvents extends EventEmitter {
  constructor(props) {
    super(props);

    this.filePaths = {}
  }

  setFilePaths(paths) {
    this.filePaths = paths
  }

  getFilePaths() {
    return this.filePaths
  }

}

module.exports.DevModeEvents = DevModeEvents