import PIXI from 'pixi.js'

import Application from '../Application'
import EndGameScreen from './EndGameScreen'

import Board from '../components/Board'

export default class GameScreen extends PIXI.Container {

  constructor () {
    super()

    this.room = colyseus.join('tictactoe')
    this.room.on('update', this.onUpdate.bind(this))

    this.waitingText = new PIXI.Text("Waiting for an opponent...", {
      font: "100px JennaSue",
      fill: '#000',
      textAlign: 'center'
    })
    this.waitingText.x = Application.WIDTH / 2 - this.waitingText.width / 2
    this.waitingText.y = Application.HEIGHT / 2 - this.waitingText.height / 2
    this.addChild(this.waitingText)

    this.on('dispose', this.onDispose.bind(this))
  }

  onJoin () {
    // not waiting anymore!
    this.removeChild(this.waitingText)

    this.timeIcon = new PIXI.Sprite.fromImage('images/clock-icon.png')
    this.timeIcon.pivot.x = this.timeIcon.width / 2
    this.timeIcon.x = Application.WIDTH / 2 - this.timeIcon.pivot.x
    this.timeIcon.y = Application.MARGIN
    this.addChild(this.timeIcon)

    this.timeRemaining = new PIXI.Text("10", {
      font: "100px JennaSue",
      fill: 0x000000,
      textAlign: 'center'
    })
    this.timeRemaining.pivot.x = this.timeRemaining.width / 2
    this.timeRemaining.x = Application.WIDTH / 2 + this.timeIcon.pivot.x + 20
    this.timeRemaining.y = Application.MARGIN - 20
    this.addChild(this.timeRemaining)

    this.board = new Board()
    this.board.pivot.x = this.board.width / 2
    this.board.pivot.y = this.board.height / 2
    this.board.x = Application.WIDTH / 2
    this.board.y = Application.HEIGHT / 2
    this.board.on('select', this.onSelect.bind(this))
    this.addChild(this.board)

    this.statusText = new PIXI.Text("Your move!", {
      font: "100px JennaSue",
      fill: 0x000,
      textAlign: 'center'
    })
    this.statusText.pivot.y = this.statusText.height / 2
    this.statusText.x = Application.WIDTH / 2 - this.statusText.width / 2
    this.statusText.y = Application.HEIGHT - Application.MARGIN
    this.addChild(this.statusText)

    this.countdownInterval = clock.setInterval(this.turnCountdown.bind(this), 1000)
  }

  onSelect (x, y) {
    this.room.send({x: x, y: y})
  }

  onUpdate (state, patches) {
    if (!this.countdownInterval && Object.keys(state.players).length === 2) {
      this.onJoin()
    }

    if (patches) {
      for (let i=0; i<patches.length; i++) {
        let patch = patches[i]

        if (patch.op === "replace" && patch.path === "/currentTurn") {
          this.nextTurn( patch.value )

        } else if (patch.op === "replace" && patch.path.indexOf("/board") === 0) {
          let [_, x, y] = patch.path.match(/\/board\/(\d)\/(\d)/)
          this.board.set(x, y, patch.value)

        } else if (patch.op === "replace" && patch.path === "/draw") {
          this.drawGame()

        } else if (patch.op === "replace" && patch.path === "/winner") {
          this.showWinner(patch.value)

        }

      }
    }
  }

  nextTurn (playerId) {
    console.log("nextTurn: ", playerId)
    if (playerId == colyseus.id) {
      this.statusText.text = "Your move!"

    } else {
      this.statusText.text = "Oppoent's turn..."
    }
    this.statusText.x = Application.WIDTH / 2 - this.statusText.width / 2

    this.timeRemaining.style.fill = '#000000';
    this.timeRemaining.text = "10"
    this.countdownInterval.reset()
  }

  turnCountdown () {
    var currentNumber = parseInt(this.timeRemaining.text, 10) - 1

    if (currentNumber >= 0) {
      this.timeRemaining.text = currentNumber.toString()
    }

    if (currentNumber <= 3) {
      this.timeRemaining.style.fill = '#934e60';
    } else {
      this.timeRemaining.style.fill = '#000000';
    }

  }

  drawGame () {
    console.log("Draw game!")
    this.emit('goto', EndGameScreen, { draw: true })
  }

  showWinner (clientId) {
    console.log("Winner!", clientId)
    this.emit('goto', EndGameScreen, { won: colyseus.id == clientId })
}

  onDispose () {
  }

}