import {
  Component,
  VERSION,
  ViewChild,
  OnInit,
  ElementRef,
} from '@angular/core';
import { fromEvent, Subscription, timer } from 'rxjs';


@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent implements OnInit {

  constructor() {

  }

  name = 'Angular ' + VERSION.major;

  subcription!: Subscription;
  @ViewChild('myCanvas', { static: true }) myCanvas!: ElementRef;

  ngOnInit() {
    this.draw1();
  }

  // draw1() {
  //   this.subcription && this.subcription.unsubscribe();
  //   const canvas = this.myCanvas.nativeElement;
  //   if (canvas.getContext) {
  //     let ctx = canvas.getContext('2d');
  //     ctx.clearRect(0, 0, canvas.width, canvas.height);
  //     canvas.width = 640;
  //     canvas.width = 640;
  //     ctx.fillStyle = "#FFFFFF";


  //     ctx.beginPath();
  //     ctx.moveTo(75, 50);
  //     ctx.lineTo(100, 75);
  //     ctx.lineTo(100, 25);
  //     ctx.fill();
  //   }
  // }


  // Get a refernece to the HTML paragraph element. The user status will be printed here.
  gameStatusPara = "gameStatusPara";




  // Create all of the terain objects. The tilemap will consist of references to these objects.
  bat = new Terrain("#6699FF", terrainTypes.BAT,
    "你踩到了蝙蝠！ 你已經飛到地圖上的一個隨機位置。<br />你迷失了方向！ 你不記得你的路徑。",
    "附近有蝙蝠。");
  wumpus = new Terrain("#CC0000", terrainTypes.WUMPUS, "wumpus把你吃了！ 你超級死。",
    "哦不，Wumpus 的氣味揮之不去。");
  treasure = new Terrain("#FFFF99", terrainTypes.TREASURE, "你找到了寶藏！ 要獲勝，您需要到達出口。", "");
  enter = new Terrain("#99EBFF", terrainTypes.ENTER, "你在入口處。", "");
  nothing = new Terrain("#FFFFF0", terrainTypes.NOTHING, "地面很清楚。", "");
  pit = new Terrain("#85855C", terrainTypes.PIT, "你掉進了無底洞。 倒霉。",
    "有草稿。 附近有個坑。");
  darkness = new Terrain("#000000", terrainTypes.DARKNESS, "", "");
  exit = new Terrain("#99FF33", terrainTypes.EXIT, "這是出口！ 去尋找寶藏，然後回到這裡。", "");

  // Global iables to store player position.
  entranceX!: number;
  entranceY!: number;
  currentCell!: number;

  mapHeight: number = 10;
  mapWidth: number = 10;
  tileWidth: number = 60;
  tileHeight: number = 60;

  map: Array<number> = new Array(100);
  // Keeps track of the indexes in the array that have been visited by the player.
  exploredPath: Array<number> = [];
  currentIndex!: number;

  // Renders all of the tiles present in this.map, making sure to mask unvisited areas with darkness.
  renderEntity() {
    for (var y = 0; y < this.mapHeight; y++) {
      for (var x = 0; x < this.mapWidth; x++) {
        // Render tile at (x,y)
        var currentTerrain = this.map[y * this.mapWidth + x];
        var xDrawPoint = x * this.tileWidth;
        var yDrawPoint = y * this.tileHeight;

        // Draw a rectangle based on the color of the given terrain type.
        // If the tile has not been visited yet, then it should be drawn as darkness.

        const canvas = this.myCanvas.nativeElement;
        if (canvas.getContext) {
          let ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          canvas.width = 640;
          canvas.width = 640;
          ctx.fillStyle = "#FFFFFF";


          if (this.exploredPath.indexOf(y * 10 + x) == -1) {
            ctx.fillStyle = "#000000";
          }
          else {
            ctx.fillStyle = "#FFFFFF";
          }
          ctx.fillRect(xDrawPoint, yDrawPoint, this.tileWidth, this.tileHeight);
        }


      }
    }

  }



  // Randomly generates a tile map, and store the entrance infomration into global variables.
  createRandomMap() {
    // First, fill the whole map with safe pathways (nothing).
    for (var i = 0; i < this.map.length; i++) {
      this.map[i] = terrainTypes.NOTHING;
    }

    var randomIndex;
    var indexesWithObjects = new Array();
    getRandomIndex() {
      do {
        randomIndex = Math.floor(Math.random() * 100);
      }
      while (indexesWithObjects.indexOf(randomIndex) !== -1);
      indexesWithObjects.push(randomIndex);
      return randomIndex;
    };

    // Add all of our unique game elements to the map. No overlap is possible with the above .
    this.map[getRandomIndex()] = terrainTypes.ENTER;
    this.map[getRandomIndex()] = terrainTypes.PIT;
    this.map[getRandomIndex()] = terrainTypes.PIT;
    this.map[getRandomIndex()] = terrainTypes.TREASURE;
    this.map[getRandomIndex()] = terrainTypes.WUMPUS;
    this.map[getRandomIndex()] = terrainTypes.BAT;
    this.map[getRandomIndex()] = terrainTypes.BAT;
    this.map[getRandomIndex()] = terrainTypes.EXIT;

    // Figure out where the entrance is, and figure out where the stick figure needs to begin (in terms of pixels).
    // Determine the currentIndex for later use.
    let enterIndex = this.map.indexOf(terrainTypes.ENTER);
    this.entranceY = Math.floor(enterIndex / 10) * 64;
    this.currentIndex = enterIndex;
    if (enterIndex % 10 > 0) {
      this.entranceX = (enterIndex % 10) * 64;
    }
    else {
      this.entranceX = 0;
    }
    // Add the entrance to the visible path.
    this.exploredPath.push(this.currentIndex);
  };



  // For use at the end of a game. Removes all darkness from the map.
  lightUpRoom() {
    for (var i = 0; i < 100; i++) {
      this.exploredPath[i] = i;
    }
  }
  // Define the constructs for the tilemap. A 10 x 10 grid, with blocks measuring 64 x 64 pixels.
  // tileMap = new TileMap(10, 10, 64, 64);

  // Creates the object that delegates the generation of textual status updates.
  statusTextGenerator = new StatusTextGenerator();

  // Constructor for the little stickFigure sprite that moves around the map.
  // The figues movements are in control of an event listener created herein.
  stickFigurePlayer() {
    this.stickFigure = new Image();
    this.x = entranceX;
    this.y = entranceY;
    this.stickFigure.src = "stickFigure.png";

    // The figure is rendered in the center of each block, begining with the entrance.
    this.renderEntity = ()
    {
      context1.drawImage(this.stickFigure, this.x + 12, this.y);
    };

    // Move the player correctly via arrow keys, and advance the game with the enter key. Manages the game state.
    window.addEventListener('keydown', (event) {
      // If the game is in the start state and the player presses an arrow key, advance the game to the PLAYING state.
      if (gameStatus.currentStatus == gameStatus.START && (event.keyCode === 37 || event.keyCode === 38 || event.keyCode === 39 || event.keyCode === 40)) {
        event.preventDefault();
        gameStatus.currentStatus = gameStatus.PLAYING;
      }
      // If the game is being played, evaluate all possible movement and update events.
      if (gameStatus.currentStatus == gameStatus.PLAYING) {
        if (event.keyCode === 37 && (stickFigure.x - tileMap.tileWidth) >= 0) // Left arrow
        {
          event.preventDefault();
          stickFigure.x -= tileMap.tileWidth;
          currentIndex--;
        }
        else if (event.keyCode === 38 && (stickFigure.y - tileMap.tileHeight) >= 0) // Up arrow
        {
          event.preventDefault();
          stickFigure.y -= tileMap.tileHeight;
          currentIndex -= tileMap.mapWidth;
        }
        else if (event.keyCode === 39 && (stickFigure.x + tileMap.tileWidth) < (tileMap.mapWidth * tileMap.tileWidth)) // Right arrow
        {
          event.preventDefault();
          stickFigure.x += tileMap.tileWidth;
          currentIndex++;
        }
        else if (event.keyCode === 40 && (stickFigure.y + tileMap.tileHeight) < (tileMap.mapHeight * tileMap.tileHeight)) // Down arrow
        {
          event.preventDefault();
          stickFigure.y += tileMap.tileHeight;
          currentIndex += tileMap.mapWidth;
        }

        statusTextGenerator.generateMainMessage();

        // If the player steps on a bat, then both the player and the bat must be transported to different areas of the map.
        if (tileMap.map[currentIndex] == bat) // Deal with landing on a bat.
        {
          var randomIndexForBat;
          var randomIndexForHuman;
          tileMap.exploredPath = []; // Clears the current path.

          // Put the bat in a random empty space.
          do {
            randomIndexForBat = Math.floor(Math.random() * 100);
          }
          while (tileMap.map[randomIndexForBat] !== nothing);
          tileMap.map[randomIndexForBat] = bat;
          tileMap.map[currentIndex] = nothing;

          // Put the player in a random empty space.
          do {
            randomIndexForHuman = Math.floor(Math.random() * 100);
          }
          while (tileMap.map[randomIndexForHuman] !== nothing);
          stickFigure.y = Math.floor(randomIndexForHuman / 10) * 64;
          currentIndex = randomIndexForHuman;
          if (randomIndexForHuman % 10 > 0) {
            stickFigure.x = (randomIndexForHuman % 10) * 64;
          }
          else {
            stickFigure.x = 0;
          }
        }
        else if (tileMap.map[currentIndex] == treasure) // Deal with landing on the treasure.
        {
          playerStats.hasTreasure = true;
        }

        tileMap.exploredPath.push(currentIndex);
        statusTextGenerator.generateContextMessage();

        // WIN AND LOSS STATES
        // If the player gets to the exit with the treasure, then they win!
        if (tileMap.map[currentIndex] == exit && playerStats.hasTreasure == true) {
          tileMap.lightUpRoom();
          playerStats.totalWins++;
          render();
          gameStatusPara.innerHTML = "<b>You escaped with the treasure! Victory is yours!<br /><br /><i>Press the enter key to go on another Wumpus Adventure.</i><br /></b>";
          gameStatus.currentStatus = gameStatus.VICTORY;
        }
        // If the player lands on the Wumpus or a pit then the game ends! No need to generate the messages of surrounding objects
        // on game over. Thus, the generateContextMessage() method occurs before this if statement.
        else if (tileMap.map[currentIndex] == wumpus || tileMap.map[currentIndex] == pit) {
          // Render the canvas with the player in the pit or wumpus. The game loop stops here, and therefore this ensures that this frame is properly rendered.
          tileMap.lightUpRoom();
          playerStats.totalLosses++;
          render();
          gameStatus.currentStatus = gameStatus.GAMEOVER;
          statusTextGenerator.updateEntity();
          gameStatusPara.innerHTML += "<br /><b><i>Press the enter key to go on another Wumpus Adventure.</b></i>"
        }
      }
      // If the player has won or lost, then give them the ability to restart the game by pressing enter.
      if (event.keyCode === 13 && (gameStatus.currentStatus == gameStatus.GAMEOVER || gameStatus.currentStatus == gameStatus.VICTORY)) {
        gameStatus.currentStatus = gameStatus.START;
        playerStats.hasTreasure = false;
        tileMap.exploredPath = [];
        tileMap.createRandomMap();
        statusTextGenerator.updateEntity();
        stickFigure.x = entranceX;
        stickFigure.y = entranceY;
        gameLoop();
      }
    });
  }

  // This constructor creates the singular StatusTextGenerator.
  // It displays the correct game information in a paragraph based on the game state.
  StatusTextGenerator() {

    this.updateEntity = ()
    {
      this.generateMainMessage();

      if (gameStatus.currentStatus != gameStatus.GAMEOVER) {
        this.generateContextMessage();
      }
    }

    // A message based on the tile currently being stood on.
    this.generateMainMessage = ()
    {
      var treasureString = "No.";
      if (playerStats.hasTreasure) {
        treasureString = "Yes!"
      }
      var spacingString = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp&nbsp;&nbsp;&nbsp;"

      // Maintains current status for the game in the paragraph element.
      gameStatusPara.innerHTML = "<b style='color:red'>TOTAL WINS: " + playerStats.totalWins + spacingString + "TOTAL LOSES: " + playerStats.totalLosses + spacingString + "Treasure Claimed?: " + treasureString + "<br />";

      // Displays the main user messged based on the game state.
      switch (gameStatus.currentStatus) {
        case gameStatus.START:
          gameStatusPara.innerHTML += "<b>Welcome to the Wumpus Adventure! You begin at the entrance.<br /><br /><i>Find the treasure, and escape through the exit. Move with the arrow keys.</i><br /></b>";
          break;
        case gameStatus.PLAYING:
          gameStatusPara.innerHTML += "<b>" + tileMap.map[currentIndex].activeMessage + "</b><br />";
          break;
        case gameStatus.GAMEOVER:
          gameStatusPara.innerHTML += "<b>" + tileMap.map[currentIndex].activeMessage + "</b><br />";
          break;
        default:
          return;
      }
    };

    // Generates the messages derived from tiles surrounding the player. Searches through the 8 tiles surrounding the player.
    this.generateContextMessage = ()
    {
      if (currentIndex % 10 != 0) {
        if (tileMap.map[currentIndex - 1] == wumpus || tileMap.map[currentIndex - 1] == pit || tileMap.map[currentIndex - 1] == bat) {
          gameStatusPara.innerHTML += "- " + tileMap.map[currentIndex - 1].nearbyMessage + "<br />";
        }
      }
      if (currentIndex % 10 != 9) {
        if (tileMap.map[currentIndex + 1] == wumpus || tileMap.map[currentIndex + 1] == pit || tileMap.map[currentIndex + 1] == bat) {
          gameStatusPara.innerHTML += "- " + tileMap.map[currentIndex + 1].nearbyMessage + "<br />";
        }
      }
      if (currentIndex > 9) {
        if (tileMap.map[currentIndex - 10] == wumpus || tileMap.map[currentIndex - 10] == pit || tileMap.map[currentIndex - 10] == bat) {
          gameStatusPara.innerHTML += "- " + tileMap.map[currentIndex - 10].nearbyMessage + "<br />";
        }
      }
      if (currentIndex < 90) {
        if (tileMap.map[currentIndex + 10] == wumpus || tileMap.map[currentIndex + 10] == pit || tileMap.map[currentIndex + 10] == bat) {
          gameStatusPara.innerHTML += "- " + tileMap.map[currentIndex + 10].nearbyMessage + "<br />";
        }
      }
      if (currentIndex < 89 && currentIndex % 10 != 9) {
        if (tileMap.map[currentIndex + 11] == wumpus || tileMap.map[currentIndex + 11] == pit || tileMap.map[currentIndex + 11] == bat) {
          gameStatusPara.innerHTML += "- " + tileMap.map[currentIndex + 11].nearbyMessage + "<br />";
        }
      }
      if (currentIndex > 10 && currentIndex % 10 != 0) {
        if (tileMap.map[currentIndex - 11] == wumpus || tileMap.map[currentIndex - 11] == pit || tileMap.map[currentIndex - 11] == bat) {
          gameStatusPara.innerHTML += "- " + tileMap.map[currentIndex - 11].nearbyMessage + "<br />";
        }
      }
      if (currentIndex < 90 && currentIndex % 10 != 0) {
        if (tileMap.map[currentIndex + 9] == wumpus || tileMap.map[currentIndex + 9] == pit || tileMap.map[currentIndex + 9] == bat) {
          gameStatusPara.innerHTML += "- " + tileMap.map[currentIndex + 9].nearbyMessage + "<br />";
        }
      }
      if (currentIndex > 9 && currentIndex % 10 != 9) {
        if (tileMap.map[currentIndex - 9] == wumpus || tileMap.map[currentIndex - 9] == pit || tileMap.map[currentIndex - 9] == bat) {
          gameStatusPara.innerHTML += "- " + tileMap.map[currentIndex - 9].nearbyMessage + "<br />";
        }
      }
    }
  }

  // Consolidates the render s. Continously renders the tileMap, the stickFigure(player).
  render() {
    context1.clearRect(0, 0, 640, 640);
    tileMap.renderEntity();
    stickFigure.renderEntity();
  }

  // The game loop continues until the player wins or loses.
  gameLoop() {
    if (gameStatus.currentStatus != gameStatus.GAMEOVER && gameStatus.currentStatus != gameStatus.VICTORY) {
      render();
      window.requestAnimationFrame(gameLoop);
    }
  }

}

// Constructor for a terrain object.
//
// Params:
// terainColor - Hex value for the color of the terrain.
// myTerrain - The terrain type. Can be expressed with the terrainTypes enumeration.
// activeMessage - The message used when the player is standing on the terrain.
// nearbyMessage - The message used when the player is surrounded by the terrain.
export class Terrain {
  terrainColor: string;
  myTerrain: number;
  activeMessage: string;
  nearbyMessage: string;
  constructor(terrainColor: string, myTerrain: number, activeMessage: string, nearbyMessage: string) {
    this.terrainColor = terrainColor;
    this.myTerrain = myTerrain;
    this.activeMessage = activeMessage;
    this.nearbyMessage = nearbyMessage;
  }
}

// An enumeration of all of the different possible terrain types.
enum terrainTypes {
  BAT = 0,
  WUMPUS = 1,
  TREASURE = 2,
  ENTER = 3,
  NOTHING = 4,
  PIT = 5,
  DARKNESS = 6,
  EXIT = 7
};

// An enumeration of all of the different possible game states.
enum gameStatus {
  START = 0,
  PLAYING = 1,
  VICTORY = 2,
  GAMEOVER = 3,
  currentStatus = 0
};

// With properties describing win, loss, and gold ownership.
enum playerStats {
  hasTreasure = 0,
  totalWins = 0,
  totalLosses = 0
};

// Constructor for a tile map object, of which there is only one.
//
// Params:
// mapHeight - The height of the map in tiles.
// mapWidth - The width of the map in tiles.
// tileWidth - The width of a single tile in pixels.
// tileHeight - The height of a single tile in pixels.
// export class TileMap {

//   mapHeight!: number;
//   mapWidth !: number;
//   tileWidth !: number;
//   tileHeight !: number;

//   map: Array<number> = new Array(100);
//   // Keeps track of the indexes in the array that have been visited by the player.
//   exploredPath: Array<number> = [];
//   currentIndex!: number;

//   @ViewChild('myCanvas', { static: true }) myCanvas!: ElementRef;
//   constructor(mapHeight: number, mapWidth: number, tileWidth: number, tileHeight: number) {
//     this.mapHeight = mapHeight;
//     this.mapWidth = mapWidth;
//     this.tileWidth = tileWidth;
//     this.tileHeight = tileHeight;
//   }

//   // Renders all of the tiles present in this.map, making sure to mask unvisited areas with darkness.
//   renderEntity() {
//     for (var y = 0; y < this.mapHeight; y++) {
//       for (var x = 0; x < this.mapWidth; x++) {
//         // Render tile at (x,y)
//         var currentTerrain = this.map[y * this.mapWidth + x];
//         var xDrawPoint = x * this.tileWidth;
//         var yDrawPoint = y * this.tileHeight;

//         // Draw a rectangle based on the color of the given terrain type.
//         // If the tile has not been visited yet, then it should be drawn as darkness.

//         const canvas = this.myCanvas.nativeElement;
//         if (canvas.getContext) {
//           let ctx = canvas.getContext('2d');
//           ctx.clearRect(0, 0, canvas.width, canvas.height);
//           canvas.width = 640;
//           canvas.width = 640;
//           ctx.fillStyle = "#FFFFFF";


//           if (this.exploredPath.indexOf(y * 10 + x) == -1) {
//             ctx.fillStyle = "#000000";
//           }
//           else {
//             ctx.fillStyle = "#FFFFFF";
//           }
//           ctx.fillRect(xDrawPoint, yDrawPoint, this.tileWidth, this.tileHeight);
//         }


//       }
//     }
//   }



//   // Randomly generates a tile map, and store the entrance infomration into global variables.
//   createRandomMap() {
//     // First, fill the whole map with safe pathways (nothing).
//     for (var i = 0; i < this.map.length; i++) {
//       this.map[i] = terrainTypes.NOTHING;
//     }

//     var randomIndex;
//     var indexesWithObjects = new Array();
//      getRandomIndex() {
//       do {
//         randomIndex = Math.floor(Math.random() * 100);
//       }
//       while (indexesWithObjects.indexOf(randomIndex) !== -1);
//       indexesWithObjects.push(randomIndex);
//       return randomIndex;
//     };

//     // Add all of our unique game elements to the map. No overlap is possible with the above .
//     this.map[getRandomIndex()] = terrainTypes.ENTER;
//     this.map[getRandomIndex()] = terrainTypes.PIT;
//     this.map[getRandomIndex()] = terrainTypes.PIT;
//     this.map[getRandomIndex()] = terrainTypes.TREASURE;
//     this.map[getRandomIndex()] = terrainTypes.WUMPUS;
//     this.map[getRandomIndex()] = terrainTypes.BAT;
//     this.map[getRandomIndex()] = terrainTypes.BAT;
//     this.map[getRandomIndex()] = terrainTypes.EXIT;

//     // Figure out where the entrance is, and figure out where the stick figure needs to begin (in terms of pixels).
//     // Determine the currentIndex for later use.
//     let enterIndex = this.map.indexOf(terrainTypes.ENTER);
//     this.entranceY = Math.floor(enterIndex / 10) * 64;
//     this.currentIndex = enterIndex;
//     if (enterIndex % 10 > 0) {
//       this.entranceX = (enterIndex % 10) * 64;
//     }
//     else {
//       this.entranceX = 0;
//     }
//     // Add the entrance to the visible path.
//     this.exploredPath.push(this.currentIndex);
//   };



//   // For use at the end of a game. Removes all darkness from the map.
//   lightUpRoom =  () {
//     for (var i = 0; i < 100; i++) {
//       this.exploredPath[i] = i;
//     }
//   }
// }
