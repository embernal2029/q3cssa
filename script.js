const game = document.getElementById("game")
const container = document.getElementById("container")
const fish = document.getElementById("fish")
const bar = document.getElementById("bar")
const fill = document.getElementById("fill")
const fishNameText = document.getElementById("fishName")
const rarityText = document.getElementById("rarity")
const scoreText = document.getElementById("score")
const skipBtn = document.getElementById("skipBtn")
const winScreen = document.getElementById("winScreen")

const shop = document.getElementById("shop")
const shopArrow = document.getElementById("shopArrow")
const rodList = document.getElementById("rodList")

const bgmTracks = [document.getElementById("bgm1"), document.getElementById("bgm2")]
const selectedBgm = bgmTracks[Math.floor(Math.random() * bgmTracks.length)]
selectedBgm.volume = 0.35

const MAX_BAR_SPEED = 5
const WIN_SCORE = 1000
const gameHeight = game.clientHeight

let holding = false
let barY = gameHeight / 2
let barVelocity = 0
let fishY = 100
let fishSpeed = 2
let progress = 0
let score = 0
let gameWon = false

// ------------------- RODS -------------------
let ownedRods = []
const rods = [
  { name:"Rod 1", cost:150, changes:{Common:0.8, Uncommon:1.14, Rare:1.04, Legendary:1.02}, sprite:"sprites/rod1.png" },
  { name:"Rod 2", cost:350, changes:{Common:0.1, Uncommon:0.5, Rare:0.25, Legendary:0.15}, sprite:"sprites/rod2.png" },
  { name:"Rod 3", cost:500, changes:{Common:0, Uncommon:0.2, Rare:0.5, Legendary:0.3}, sprite:"sprites/rod3.png" }
]

// ------------------- FISH -------------------
const fishData = [
  { name:"Sunfish", rarity:"Common", sprite:"sprites/sunfish.png", speed:1.6, points:10, chance:10, catchRate:1 },
  { name:"Bluegill", rarity:"Common", sprite:"sprites/sunfish.png", speed:1.7, points:10, chance:10, catchRate:1 },
  { name:"Minnow", rarity:"Common", sprite:"sprites/sunfish.png", speed:1.5, points:8, chance:10, catchRate:1 },
  { name:"Catfish", rarity:"Uncommon", sprite:"sprites/catfish.png", speed:2.3, points:25, chance:6, catchRate:0.8 },
  { name:"Sturgeon", rarity:"Rare", sprite:"sprites/sturgeon.png", speed:3.4, points:50, chance:5, catchRate:0.55 },
  { name:"Crimson Leviathan", rarity:"Legendary", sprite:"sprites/leviathan.png", speed:4.8, points:150, chance:1, catchRate:0.35, jitter:true }
]

// ------------------- SPAWN -------------------
function getRandomFish() {
  const totalChance = fishData.reduce((sum, f) => sum + f.chance, 0)
  let roll = Math.random() * totalChance
  for (const f of fishData) {
    if (roll < f.chance) return f
    roll -= f.chance
  }
  return fishData[0]
}

let currentFish
function spawnFish() {
  progress = 0
  fill.style.height = "0%"
  currentFish = getRandomFish()
  fish.style.backgroundImage = `url(${currentFish.sprite})`
  fish.classList.toggle("legendary", currentFish.rarity === "Legendary")
  fishNameText.textContent = "Fish: " + currentFish.name
  rarityText.textContent = "Rarity: " + currentFish.rarity
  fishY = Math.random() * (gameHeight - fish.clientHeight)
  fishSpeed = currentFish.speed * (Math.random() > 0.5 ? 1 : -1)
  container.classList.toggle("shake", currentFish.rarity === "Legendary")
}

// ------------------- SHOP -------------------
function renderShop() {
  rodList.innerHTML = ""
  rods.forEach((rod, index) => {
    const rodDiv = document.createElement("div")
    rodDiv.classList.add("rodItem")
    if (ownedRods.includes(index) || score < rod.cost) rodDiv.classList.add("disabled")
    rodDiv.innerHTML = `<img src="${rod.sprite}"><div>${rod.name} - ${rod.cost} pts</div>`
    rodDiv.addEventListener("click", () => buyRod(index))
    rodList.appendChild(rodDiv)
  })
}

function buyRod(index) {
  const rod = rods[index]
  if (score >= rod.cost && !ownedRods.includes(index)) {
    score -= rod.cost
    scoreText.textContent = `Score: ${score} / ${WIN_SCORE}`
    ownedRods.push(index)
    applyRod(rod)
    renderShop()
  }
}

function applyRod(rod) {
  const rarities = ["Common","Uncommon","Rare","Legendary"]
  rarities.forEach(r => {
    const fishOfRarity = fishData.filter(f => f.rarity === r)
    fishOfRarity.forEach(f => f.chance = rod.changes[r]*100/fishOfRarity.length)
  })
}

// Toggle shop
shopArrow.addEventListener("click", () => {
  shop.classList.toggle("open")
  shopArrow.textContent = shop.classList.contains("open") ? "⬅" : "➡"
})

// ------------------- GAME LOOP -------------------
function updateFish() {
  fishY += fishSpeed
  if (currentFish.jitter) fishY += (Math.random()-0.5)*4
  fishY = Math.max(0, Math.min(gameHeight - fish.clientHeight, fishY))
  if (fishY === 0 || fishY === gameHeight - fish.clientHeight) fishSpeed *= -1
  fish.style.top = fishY + "px"
}

function updateBar() {
  barVelocity += holding ? -0.6 : 0.5
  barVelocity *= 0.9
  barVelocity = Math.max(-MAX_BAR_SPEED, Math.min(MAX_BAR_SPEED, barVelocity))
  barY += barVelocity
  barY = Math.max(0, Math.min(gameHeight - bar.clientHeight, barY))
  bar.style.top = barY + "px"
}

function checkOverlap() {
  const barTop = barY
  const barBottom = barY + bar.clientHeight
  const fishTop = fishY
  const fishBottom = fishY + fish.clientHeight

  if (barBottom > fishTop && barTop < fishBottom) progress += 0.7*currentFish.catchRate
  else progress -= 0.6/currentFish.catchRate

  progress = Math.max(0, Math.min(100, progress))
  fill.style.height = progress+"%"

  if (progress>=100) {
    score += currentFish.points
    scoreText.textContent = `Score: ${score} / ${WIN_SCORE}`
    container.classList.remove("shake")
    if (score>=WIN_SCORE) winScreen.style.display="flex"
    spawnFish()
    renderShop()
  }
}

// ------------------- CONTROLS -------------------
document.addEventListener("mousedown",()=>holding=true)
document.addEventListener("mouseup",()=>holding=false)
document.addEventListener("keydown", e=>{
  if(e.code==="Space") holding=true
  if(e.code==="KeyS"){progress=0;spawnFish()}
  // Secret set score
  if(e.ctrlKey && e.shiftKey && e.code==="KeyP"){
    const newScore=parseInt(prompt("Enter secret score:"),10)
    if(!isNaN(newScore)&&newScore>=0){score=newScore;scoreText.textContent=`Score: ${score} / ${WIN_SCORE}`;renderShop()}
  }
})
document.addEventListener("keyup",e=>{if(e.code==="Space")holding=false})
document.addEventListener("mousedown",()=>selectedBgm.play())
document.addEventListener("keydown",()=>selectedBgm.play())
skipBtn.addEventListener("click",()=>{progress=0;spawnFish()})

// ------------------- START -------------------
bar.style.top = barY+"px"
spawnFish()
renderShop()
function gameLoop(){if(!gameWon){updateFish();updateBar();checkOverlap();requestAnimationFrame(gameLoop)}}
gameLoop()
