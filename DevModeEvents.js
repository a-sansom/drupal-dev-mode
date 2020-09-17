const EventEmitter = require('events')

class DevModeEvents extends EventEmitter {
  constructor(props) {
    super(props);

    this.filePaths = {}
    this.log = []
  }

  setFilePaths(paths) {
    this.filePaths = paths
  }

  getFilePaths() {
    return this.filePaths
  }

  addlog(message) {
    this.log.push(message)
  }

  addlogs(messages) {
    messages.forEach((line) => this.addlog(line))
  }

  getLog() {
    return this.log
  }

  getLogForConsoleTable() {
    return this.log.map((message) => {
      return {
        'Message': message
      }
    })
  }

}

module.exports.DevModeEvents = DevModeEvents