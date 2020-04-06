import Box from "./box";
import Geometry from "./geometry";
import Light, { Fan } from "./miscObjects";

var map1Images = [];

const worldBackStyle = "map1/bg_back_futu_01.jpg";
map1Images.push(worldBackStyle);
const worldMiddleStyle = "";
const worldFrontStyle = "map1/map1_bg_full_new06_w_arrows_small.png";
map1Images.push(worldFrontStyle);

const map1VerticalWall = "map1/vertical_wall_and_sky.png";
map1Images.push(map1VerticalWall);
const map1Ceiling = "map1/ceiling_pattern.png";
map1Images.push(map1Ceiling);
const map1BricksFloor = "map1/bricks_floor.png";
map1Images.push(map1BricksFloor);
const map1InterlevelBricks = "map1/interlevel_bricks_pattern1.png";
map1Images.push(map1InterlevelBricks);

const leftWallStyle = {
  backgroundImage: `url(${map1VerticalWall})`,
  backgroundRepeat: "repeat-y"
};

const ceilingStyle = {
  backgroundImage: `url(${map1Ceiling})`,
  backgroundRepeat: "repeat-x"
};

const floorStyle = {
  backgroundImage: `url(${map1BricksFloor})`,
  backgroundRepeat: "repeat-x"
};

const brickStyle2 = {
  backgroundImage: `url(${map1InterlevelBricks})`,
  backgroundRepeat: "repeat-x",
  backgroundSize: "50px 50px",
  overflow: "hidden",
  borderRadius: 3
};

const invisibleBoxStyle = {
  overflow: "hidden"
  // Uncomment to display actual boxes for debugging.
  //backgroundColor: "blue"
};

const srcMap1Toilet1 = "map1/map1_2d_furniture_toilet1_00.png";
map1Images.push(srcMap1Toilet1);
const srcMap1Toilet2 = "map1/map1_2d_furniture_toilet2_00.png";
map1Images.push(srcMap1Toilet2);
const srcMap1Sofa1 = "map1/map1_2d_furniture_sofa_full.png";
map1Images.push(srcMap1Sofa1);
const srcMap1Tv1 = "map1/map1_2d_furniture_tv_full.png";
map1Images.push(srcMap1Tv1);
const srcMap1Fridge = "map1/map1_2d_furniture_fridge.png";
map1Images.push(srcMap1Fridge);
const srcMap1Car = "map1/map1_2d_furniture_car.png";
map1Images.push(srcMap1Car);
const srcMap1Bed = "map1/map1_2d_furniture_bed.png";
map1Images.push(srcMap1Bed);
const srcMap1Cactus = "map1/map1_2d_furniture_cactus.png";
map1Images.push(srcMap1Cactus);
const srcMap1Wash = "map1/map1_2d_furniture_wash_full.png";
map1Images.push(srcMap1Wash);
const srcMap1DigiClock1 = "map1/map1_2d_furniture_digi_clock1.png";
map1Images.push(srcMap1DigiClock1);
const srcMap1Pants = "map1/map1_2d_furniture_pants.png";
map1Images.push(srcMap1Pants);

const srcAnalogClockBg = "map1/map1_2d_furniture_clock_bg.png";
map1Images.push(srcAnalogClockBg);
const srcAnalogClockMinArrow = "map1/map1_2d_furniture_clock_arrow1.png";
map1Images.push(srcAnalogClockMinArrow);
const srcAnalogClockSecArrow = "map1/map1_2d_furniture_clock_arrow2.png";
map1Images.push(srcAnalogClockSecArrow);

const srcMap1Chander = "map1/map1_2d_furniture_chander_no_bulb.png";
map1Images.push(srcMap1Chander);
const srcMap1Table1 = "map1/map1_2d_furniture_table1.png";
map1Images.push(srcMap1Table1);
const srcMap1Table2 = "map1/map1_2d_furniture_table2.png";
map1Images.push(srcMap1Table2);

const srcMap1Ladder = "map1/map1_2d_furniture_ladder1.png";
map1Images.push(srcMap1Ladder);

const srcMap1Tnt = "map1/map1_2d_furniture_tnt_full.png";
map1Images.push(srcMap1Tnt);
const srcMap1Books = "map1/map1_2d_furniture_books_full.png";
map1Images.push(srcMap1Books);
const srcMap1Trash = "map1/map1_2d_furniture_trash.png";
map1Images.push(srcMap1Trash);
const srcMap1Pizza = "map1/map1_2d_furniture_pizza.png";
map1Images.push(srcMap1Pizza);
const srcMap1Pinball = "map1/map1_2d_furniture_pinball.png";
map1Images.push(srcMap1Pinball);

const srcMap1Fire = "map1/map1_2d_furniture_fire_full.png";
map1Images.push(srcMap1Fire);
const srcMap1Phone = "map1/map1_2d_furniture_phone_full.png";
map1Images.push(srcMap1Phone);

const srcMap1Bricks = "map1/map1_2d_furniture_3bricks.png";
map1Images.push(srcMap1Bricks);
const srcMap1Aqua = "map1/map1_2d_furniture_aqua.png";
map1Images.push(srcMap1Aqua);
const srcMap1Banana = "map1/map1_2d_furniture_banana.png";
map1Images.push(srcMap1Banana);
const srcMap1Bottle = "map1/map1_2d_furniture_bottle.png";
map1Images.push(srcMap1Bottle);
const srcMap1Direct = "map1/map1_2d_furniture_direct_tv.png";
map1Images.push(srcMap1Direct);
const srcMap1Fan = "map1/map1_2d_furniture_fan_full.png";
map1Images.push(srcMap1Fan);
const srcMap1Fish1 = "map1/map1_2d_furniture_fish1.png";
map1Images.push(srcMap1Fish1);
const srcMap1Fish2 = "map1/map1_2d_furniture_fish2.png";
map1Images.push(srcMap1Fish2);
const srcMap1Garden1 = "map1/map1_2d_furniture_garden1.png";
map1Images.push(srcMap1Garden1);
const srcMap1Mac = "map1/map1_2d_furniture_mac.png";
map1Images.push(srcMap1Mac);
const srcMap1Parking = "map1/map1_2d_furniture_parking.png";
map1Images.push(srcMap1Parking);
const srcMap1Pumpkin = "map1/map1_2d_furniture_pumpkin.png";
map1Images.push(srcMap1Pumpkin);
const srcMap1Radiator = "map1/map1_2d_furniture_radiator.png";
map1Images.push(srcMap1Radiator);
const srcMap1Mirror = "map1/map1_2d_furniture_table3.png";
map1Images.push(srcMap1Mirror);
const srcMap1Weed = "map1/map1_2d_furniture_weed_tree.png";
map1Images.push(srcMap1Weed);
const srcMap1Vent = "map1/map1_2d_furniture_vent.png";
map1Images.push(srcMap1Vent);

const srcMap1ToiletSign = "map1/map1_2d_furniture_toilet_sign.png";
map1Images.push(srcMap1ToiletSign);
const srcMap1Exit = "map1/map1_2d_furniture_exit_full.png";
map1Images.push(srcMap1Exit);

const srcMap1Swing = "map1/map1_2d_furniture_swing.png";
map1Images.push(srcMap1Swing);
const srcMap1Poster = "map1/deadbool_poster_for_game.png";
const srcMap1Propeller = "map1/map1_2d_furniture_propeller.png";
map1Images.push(srcMap1Propeller);

function getBoxBgStyle(imgSrc) {
  return {
    backgroundImage: `url(${imgSrc})`,
    backgroundSize: "100% 100%",
    backgroundPosition: "0px 0px",
    overflow: "hidden"
  };
}

function LoadMap1(state, isServer) {
  // General map attributes
  state.worldWidth = 5000;
  state.worldHeight = 3250;
  state.floorY = 0; // should always be 0;

  state.mapStyle = {
    back: worldBackStyle,
    middle: worldMiddleStyle,
    front: worldFrontStyle
  };

  // TODO: Debug there is one place where we revive midair on the first floor!
  state.playerBirthPlaces = [
    [0, 0], // basement near washing machine
    [2200, 0], // basement near box1
    [2800, 0], // basement near box2
    [4900, 0], // basement near car
    [0, 700], // 1st floor near fridge
    [700, 700], // 1st floor near aquarium
    [850, 1010], // 1st floor near table
    [4900, 700], // 1st floor near toilet1
    [1600, 1620], // 1st floor on dish
    [4900, 1890], // 1st floor on the ladder
    [350, 1967], // 1st floor near fan
    [0, 2600], // attic near toilet2
    [1950, 2790], // attic sofa
    [4900, 2600] // attic near ikea bed
  ];

  state.perkCreationPlaces = [
    [4835, 450], // basement near car
    [2114, 480], // basement bricks
    [1650, 1100], // 1st floor above aquarium
    [4180, 1350], // 1st floor fire
    [2430, 1700], // 1st floor tv
    [1600, 2350], // 1st floor lamp 1
    [3200, 2350], // 1st floor lamp 2
    [10, 3100], // attic toilet
    [2550, 3100] // attic checkout
  ];

  // Mover above fridge
  state.createDynamicBox(0, 1330, 200, 25, 0, 1150, 2000);
  state.createDynamicBox(
    0,
    1330,
    200,
    25,
    0,
    1150,
    2000,
    getBoxBgStyle(srcMap1Pizza),
    { interactable: false, extra: { sound: "mover" } }
  );

  // Mover in attic
  state.createDynamicBox(300, 2844, 180, 10, 860, 0, 2200, invisibleBoxStyle);
  state.createDynamicBox(
    300,
    2950 - 170,
    220,
    220,
    860,
    0,
    2200,
    getBoxBgStyle(srcMap1Mac),
    { interactable: false, extra: { sound: "mover" } }
  );

  // Toilet teleport pair
  // --------------------------
  state.createBgBox(
    state.worldWidth - 318,
    -2 + 700,
    320,
    480,
    getBoxBgStyle(srcMap1Toilet1)
  );
  state.createBgBox(-10, 2600, 320, 320, getBoxBgStyle(srcMap1Toilet2));

  state.createStaticBox(
    state.worldWidth - 318,
    856,
    200,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(147, 2741, 155, 10, invisibleBoxStyle);
  state.convertBoxToTeleport(
    state.boxes[Object.keys(state.boxes).length - 2],
    state.boxes[Object.keys(state.boxes).length - 1]
  );
  // tel1
  state.createStaticBox(
    state.worldWidth - 80,
    700,
    80,
    323,
    invisibleBoxStyle,
    {
      sideBump: true
    }
  );

  // tel2
  state.createStaticBox(137, 2750, 10, 150, invisibleBoxStyle, {
    sideBump: true
  });
  state.createStaticBox(0, 2850, 130, 10, invisibleBoxStyle);

  // platforms in the bathroom
  state.createStaticBox(4150 - 15, 1200 - 14 - 20, 200, 10, invisibleBoxStyle);
  state.createBgBox(4100 - 15, 900 - 20, 300, 300, getBoxBgStyle(srcMap1Fire));

  // toilet sign
  state.createBgBox(4470, 1010, 260, 250, getBoxBgStyle(srcMap1ToiletSign));
  state.createStaticBox(4500, 1163, 200, 10, invisibleBoxStyle);
  state.convertLastBoxToSpring(0, 2.5);
  // --------------------------

  // sofa
  // --------------------------
  state.createBgBox(
    1200 + 170,
    900 - 8 - 200 + 1900,
    750,
    375,
    getBoxBgStyle(srcMap1Sofa1)
  );
  state.createStaticBox(
    1327 + 170,
    1000 - 200 + 1900,
    500,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    1200 + 170 + 20,
    1080 - 200 + 1900 + 1,
    80,
    10,
    invisibleBoxStyle,
    { sideBump: true }
  );
  state.createStaticBox(
    1830 + 170 + 20,
    1080 - 200 + 1900 + 1,
    80,
    10,
    invisibleBoxStyle,
    { sideBump: true }
  );
  state.createStaticBox(
    1265 + 170,
    1220 - 200 + 1900 + 4,
    610,
    10,
    invisibleBoxStyle
  );
  // --------------------------

  // tv
  // --------------------------
  // antenna
  state.createBgBox(1530, 1233, 500, 500, getBoxBgStyle(srcMap1Direct));
  state.createStaticBox(1595, 1606, 210, 10, invisibleBoxStyle);
  // screen
  state.createBgBox(2000, -4 + 700, 1000, 1000, getBoxBgStyle(srcMap1Tv1));
  state.createStaticBox(2043, 860, 911, 10, invisibleBoxStyle);
  // iframe and box that comes with it
  {
    let iframeBottomY = 243 + 700;
    let iframeLeftX = 2020;
    let iframeH = 507;
    let iframeW = 960;
    let geometry = new Geometry();
    let box = new Box(Object.keys(state.boxes).length, geometry, undefined);
    box.setLeftX(iframeLeftX);
    box.setBottomY(iframeBottomY);
    box.setH(iframeH);
    box.setW(iframeW);
    box.stats.interactable = false; // note: the screen itself is not interactable
    state.boxes[box.stats.id] = box;
    state.iframeBox = state.boxes[box.stats.id];

    // top of the tv
    state.createStaticBox(2020, 943 + 507 + 5, 960, 10, invisibleBoxStyle);
  }
  // --------------------------

  // fridge
  // --------------------------
  state.createBgBox(-30, -2 + 700, 660, 660, getBoxBgStyle(srcMap1Fridge));
  state.createStaticBox(45, 82 + 700, 380, 10, invisibleBoxStyle);
  state.createStaticBox(20, 225 + 700, 400, 10, invisibleBoxStyle);
  state.createStaticBox(223, 408 + 700, 200, 10, invisibleBoxStyle);
  state.createStaticBox(130, 596 + 700, 400, 10, invisibleBoxStyle);
  state.createStaticBox(0, 645 + 700, 370, 10, invisibleBoxStyle);
  // --------------------------

  // car
  // --------------------------
  state.createBgBox(
    state.worldWidth - 315,
    -30,
    400,
    400,
    getBoxBgStyle(srcMap1Parking)
  );
  state.createBgBox(
    state.worldWidth - 1000,
    -2,
    750 + 30,
    500 + 20,
    getBoxBgStyle(srcMap1Car)
  );
  state.createStaticBox(
    state.worldWidth - 750 + 10,
    35,
    350,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    state.worldWidth - 750 + 10,
    200 - 4,
    420,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    state.worldWidth - 750 + 60,
    400 - 42,
    310,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    state.worldWidth - 750 + 140,
    470 - 3 + 20,
    220,
    10,
    invisibleBoxStyle
  );
  // --------------------------

  // wash
  // --------------------------
  state.createBgBox(0, -4, 350, 500, getBoxBgStyle(srcMap1Wash));
  state.createStaticBox(0, 298, 330, 10, invisibleBoxStyle);
  state.createStaticBox(0, 386, 330, 10, invisibleBoxStyle);
  state.createBgBox(350, 655 - 450, 450, 450, getBoxBgStyle(srcMap1Pants));
  state.createStaticBox(500, 522, 140, 10, invisibleBoxStyle);

  state.createBgBox(340, 0, 200, 270, getBoxBgStyle(srcMap1Trash));
  state.createStaticBox(360, 150, 150, 10, invisibleBoxStyle);
  // --------------------------

  // bed
  // --------------------------
  // cactus
  state.createBgBox(
    state.worldWidth - 240,
    2600,
    250,
    600,
    getBoxBgStyle(srcMap1Cactus)
  );
  state.createStaticBox(
    state.worldWidth - 240,
    2600,
    250,
    305,
    {},
    { sideBump: true }
  );
  // --------------------------
  state.createBgBox(
    state.worldWidth - 960,
    2600,
    750,
    375,
    getBoxBgStyle(srcMap1Bed)
  );
  state.createStaticBox(
    state.worldWidth - 960 + 30 + 120,
    2740 - 1,
    680 - 120,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    state.worldWidth - 960 + 30,
    2740 - 1,
    120,
    10,
    invisibleBoxStyle
  );
  state.convertLastBoxToSpring(-2.8, 1.8);
  // --------------------------

  // platforms in living room
  // plants
  state.createBgBox(2700, 1714, 335, 335, getBoxBgStyle(srcMap1Weed));
  state.createStaticBox(2740, 1765, 265, 10, invisibleBoxStyle);

  // flowers
  state.createBgBox(2000 - 25, 1680, 300, 300, getBoxBgStyle(srcMap1Garden1));
  state.createStaticBox(2000 - 15, 1765, 265, 10, invisibleBoxStyle);

  // pumpkin
  state.createBgBox(2330, 1850 - 1, 300, 300, getBoxBgStyle(srcMap1Pumpkin));
  state.createStaticBox(2430 - 83, 1965 - 2, 266, 10, invisibleBoxStyle);
  state.createStaticBox(
    2450 - 83,
    1965 - 11 + 100,
    266 - 40,
    10,
    invisibleBoxStyle
  );
  // swing
  state.createBgBox(2221, 2010, 750, 720, getBoxBgStyle(srcMap1Swing));
  state.createStaticBox(2500, 2210, 190, 10, invisibleBoxStyle);
  state.convertLastBoxToSpring(0, 2.5);

  // books
  state.createBgBox(3270, 1400 + 17, 500, 200, getBoxBgStyle(srcMap1Books));
  state.createStaticBox(3270, 1606, 500, 10, invisibleBoxStyle);

  // bottle mover
  state.createDynamicBox(
    3940,
    1400 + 200,
    250,
    10,
    500,
    450,
    3000,
    invisibleBoxStyle
  );
  state.createDynamicBox(
    3900,
    1510,
    300,
    300,
    500,
    450,
    3000,
    getBoxBgStyle(srcMap1Bottle),
    { interactable: false, extra: { sound: "mover" } }
  );

  // lamps above living room
  state.createBgBox(1500, 2060 - 2, 500, 540, getBoxBgStyle(srcMap1Chander));
  state.createStaticBox(1515, 2305, 460, 10, invisibleBoxStyle);
  state.createBgBox(3075, 2060 - 2, 500, 540, {
    ...getBoxBgStyle(srcMap1Chander),
    transform: "scaleX(-1)"
  });
  state.createStaticBox(3097, 2305, 460, 10, invisibleBoxStyle);

  // lights on lamp1
  let colorOn = "rgb(249, 248, 150)";
  let colorOff = "rgb(216, 245, 251)";
  state.backlights.push(
    new Light(
      18 /*radius*/,
      1550,
      2264,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      19 /*radius*/,
      1604,
      2256,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      22 /*radius*/,
      1669,
      2248,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      42 /*radius*/,
      1750,
      2240,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      22 /*radius*/,
      1825,
      2248,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      20 /*radius*/,
      1892,
      2256,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      17 /*radius*/,
      1953,
      2264,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  // lights lamp2
  state.backlights.push(
    new Light(
      18 /*radius*/,
      1750 + 1575 + 1750 - 1550,
      2264,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      19 /*radius*/,
      1750 + 1575 + 1750 - 1604,
      2256,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      22 /*radius*/,
      1750 + 1575 + 1750 - 1669,
      2248,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      42 /*radius*/,
      1750 + 1575,
      2240,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      22 /*radius*/,
      1750 + 1575 + 1750 - 1825,
      2248,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      20 /*radius*/,
      1750 + 1575 + 1750 - 1892,
      2256,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );
  state.backlights.push(
    new Light(
      17 /*radius*/,
      1750 + 1575 + 1750 - 1953,
      2264,
      [
        { color: colorOn, time: 2500 },
        { color: colorOff, time: 500 }
      ],
      state.timeStamp
    )
  );

  // table2
  state.createBgBox(750 - 6, 700, 313, 390, getBoxBgStyle(srcMap1Table2));
  state.createStaticBox(750, 700 + 300, 300, 10, invisibleBoxStyle);
  state.convertLastBoxToSpring(0, 3.1);

  // aqua
  state.createBgBox(1500 - 6, 700 - 30, 390, 390, getBoxBgStyle(srcMap1Aqua), {
    extra: { sound: "water" }
  });
  state.createDynamicBox(
    1550,
    875,
    80,
    80,
    200,
    0,
    4000,
    getBoxBgStyle(srcMap1Fish1),
    {
      interactable: false,
      extra: { mirrorOnWayBack: true }
    }
  );
  state.createDynamicBox(
    1610,
    820,
    80,
    80,
    60,
    0,
    1200,
    getBoxBgStyle(srcMap1Fish2),
    {
      interactable: false,
      extra: { mirrorOnWayBack: true }
    }
  );
  state.createStaticBox(1500 + 10, 700 + 300 + 10, 330, 10, invisibleBoxStyle);

  // table1
  state.createBgBox(3200 - 6, 700, 313, 313, getBoxBgStyle(srcMap1Table1));
  state.createStaticBox(3200, 700 + 300, 300, 10, invisibleBoxStyle);
  // Digital clock on the table
  let digi1 = state.createDigitalClock(
    Object.keys(state.boxes).length,
    3350 - 100,
    1011,
    200,
    100,
    srcMap1DigiClock1
  );
  state.boxes[digi1.id] = digi1;

  // sofa
  // --------------------------
  state.createBgBox(
    1200 + 170,
    900 - 8 - 200 + 1900,
    750,
    375,
    getBoxBgStyle(srcMap1Sofa1)
  );
  state.createStaticBox(
    1327 + 170,
    1000 - 200 + 1900,
    500,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    1200 + 170,
    1080 - 200 + 1900 + 1,
    120,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    1830 + 170,
    1080 - 200 + 1900 + 1,
    120,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    1265 + 170,
    1220 - 200 + 1900 + 2,
    620,
    10,
    invisibleBoxStyle
  );
  // --------------------------

  // platform above the fridge
  state.createBgBox(500, 1930, 400, 400, getBoxBgStyle(srcMap1Fan));
  state.createBgBox(300, 1858, 630, 110, getBoxBgStyle(srcMap1Radiator));
  state.createStaticBox(320, 1957, 575, 10, invisibleBoxStyle);
  state.createStaticBox(740, 2050, 100, 10, invisibleBoxStyle);
  state.convertLastBoxToSpring(2.6, 2.2);

  // platforms above toilet1
  state.createBgBox(
    state.worldWidth - 690,
    1550 - 8,
    920,
    1050,
    getBoxBgStyle(srcMap1Ladder)
  );
  state.createStaticBox(
    state.worldWidth - 200,
    1700 - 1,
    200,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    state.worldWidth - 200,
    1880,
    200,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    state.worldWidth - 200,
    1880 + 180,
    200,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    state.worldWidth - 200,
    1880 + 360,
    200,
    10,
    invisibleBoxStyle
  );
  state.createStaticBox(
    state.worldWidth - 200,
    1880 + 540 - 2,
    200,
    10,
    invisibleBoxStyle
  );

  // platforms in the basement
  state.createBgBox(1800 - 10, -5, 205, 197, getBoxBgStyle(srcMap1Tnt));
  state.createStaticBox(1800, 80, 180, 110, invisibleBoxStyle, {
    sideBump: true
  });
  state.createBgBox(3000 - 10, -5, 205, 197, getBoxBgStyle(srcMap1Tnt));
  state.createStaticBox(3000, 80, 180, 110, invisibleBoxStyle, {
    sideBump: true
  });

  state.createBgBox(
    2100 - 53 - 30,
    206,
    270,
    270,
    getBoxBgStyle(srcMap1Bricks)
  );
  state.createStaticBox(2100 - 30, 360, 180, 10, invisibleBoxStyle);
  state.createBgBox(
    2700 - 53 + 50,
    206,
    270,
    270,
    getBoxBgStyle(srcMap1Bricks)
  );
  state.createStaticBox(2700 + 50, 360, 180, 10, invisibleBoxStyle);

  // teleport pair from basement to attic
  state.createBgBox(
    (state.worldWidth - 190) / 2,
    509,
    190,
    190,
    getBoxBgStyle(srcMap1Vent)
  );
  state.createBgBox(3050, 2560, 200, 200, getBoxBgStyle(srcMap1Vent));
  state.createStaticBox(2400, 540, 200, 10, invisibleBoxStyle);
  state.createStaticBox(3050, 2600 - 10, 200, 10, invisibleBoxStyle);
  state.convertBoxToTeleport(
    state.boxes[Object.keys(state.boxes).length - 2],
    state.boxes[Object.keys(state.boxes).length - 1]
  );

  // spring in basement
  state.createBgBox(
    (state.worldWidth - 400) / 2,
    0,
    400,
    551,
    getBoxBgStyle(srcMap1Pinball)
  );
  state.createStaticBox(
    (state.worldWidth - 200) / 2,
    180,
    200,
    10,
    invisibleBoxStyle,
    { extra: { sound: "arcanoid" } }
  );
  state.convertLastBoxToSpring(0, 3.55);

  // platforms in the attic
  state.createBgBox(3535, 2685, 300, 300, getBoxBgStyle(srcMap1Phone));
  state.createStaticBox(3610, 2960, 150, 10, invisibleBoxStyle);

  // express exit
  state.createBgBox(2470, 2806, 270, 250, getBoxBgStyle(srcMap1Exit));
  //state.createBgBox(2470, 2736, 270, 320, getBoxBgStyle(srcMap1Poster));
  state.createStaticBox(2500, 2960, 200, 10, invisibleBoxStyle);

  state.createBgBox(2900, 2780 - 215, 500, 500, getBoxBgStyle(srcMap1Mirror));
  state.createStaticBox(2990, 2825, 320, 10, invisibleBoxStyle);
  state.createStaticBox(3075, 2700, 140, 10, invisibleBoxStyle);
  // --------------------------

  // brick walls (last to cover)
  // --------------------------
  // left wall
  state.createBgBox(-200, -200, 200, state.worldHeight + 200, leftWallStyle, {
    sideBump: true,
    wall: true
  });
  // right wall
  state.createBgBox(
    state.worldWidth,
    -200,
    200,
    state.worldHeight + 200,
    {
      ...leftWallStyle,
      transform: "scaleX(-1)"
    },
    { sideBump: true, wall: true }
  );
  // floor
  state.createBgBox(-200, -200, state.worldWidth + 400, 200, floorStyle, {
    wall: true
  });
  // 2nd floor
  state.createStaticBox(0, 650, 1000, 50, brickStyle2, {
    reverseGravityBump: true,
    wall: true
  });
  state.createStaticBox(1500, 650, 2000, 50, brickStyle2, {
    reverseGravityBump: true,
    wall: true
  });
  state.createStaticBox(4000, 650, state.worldWidth - 4000, 50, brickStyle2, {
    reverseGravityBump: true,
    wall: true
  });
  //3rd floor
  state.createStaticBox(0, 2550, 600, 50, brickStyle2, {
    reverseGravityBump: true,
    wall: true
  });
  state.createStaticBox(1200, 2550, 475, 50, brickStyle2, {
    reverseGravityBump: true,
    wall: true
  });
  state.createStaticBox(1200 + 475 + 150, 2550, 475, 50, brickStyle2, {
    reverseGravityBump: true,
    wall: true
  });
  state.createStaticBox(2900, 2550, 500, 50, brickStyle2, {
    reverseGravityBump: true,
    wall: true
  });
  state.createStaticBox(4000, 2550, state.worldWidth - 4000, 50, brickStyle2, {
    reverseGravityBump: true,
    wall: true
  });
  // ceiling
  state.createBgBox(
    -200,
    state.worldHeight,
    state.worldWidth + 400,
    200,
    ceilingStyle,
    { wall: true }
  );
  // --------------------------
  // washing timer
  let timer1 = { id: 0, timeout: 40000, perk: "quad", x: 31, y: 520 };
  let digi2 = state.createDigitalClock(
    Object.keys(state.boxes).length,
    185, // x
    323, // y
    131, // w
    57, // h
    srcMap1DigiClock1,
    0 // timerId
  );
  state.boxes[digi2.stats.id] = digi2;
  state.initTimerStats.push(timer1);

  // bed timer
  let timer2 = { id: 1, timeout: 40000, perk: "skull", x: 4810, y: 3130 };
  let ana1 = state.createAnalogClock(
    Object.keys(state.boxes).length,
    4300, // x
    2900, // y
    150, // r
    [srcAnalogClockBg, srcAnalogClockMinArrow, srcAnalogClockSecArrow],
    1 // timerId
  );
  state.boxes[ana1.stats.id] = ana1;
  state.initTimerStats.push(timer2);

  // analog clock
  let ana2 = state.createAnalogClock(
    Object.keys(state.boxes).length,
    780,
    1250,
    170,
    [srcAnalogClockBg, srcAnalogClockMinArrow, srcAnalogClockSecArrow]
  );
  state.boxes[ana2.stats.id] = ana2;

  // lights around pinball
  let colors = ["rgb(78, 125, 247)", "rgb(233, 246, 170)", "rgb(250, 82, 82)"];
  let rad = 10;
  let per = 80;
  let lightLocations = [
    [2305, 5],
    [2305, 5 + 30],
    [2305, 5 + 30 * 2],
    [2305, 5 + 30 * 3],
    [2305, 5 + 30 * 4],
    [2305, 5 + 30 * 5 + 2],
    [2305, 190],
    // --
    [2305 + 7 * 1, 190 + 35 * 1],
    [2305 + 7 * 2, 190 + 35 * 2],
    [2305 + 7 * 3, 190 + 35 * 3],
    [2305 + 7 * 4, 190 + 35 * 4],
    [2305 + 7 * 5, 190 + 35 * 5],
    [2305 + 7 * 6, 190 + 35 * 6],
    [2305 + 7 * 7, 190 + 35 * 7],
    [2305 + 7 * 8, 190 + 35 * 8],
    [2305 + 7 * 9, 190 + 35 * 9],
    // --
    [2375, 545],
    [2375 + 40 * 1 + 5, 545],
    [2375 + 40 * 2 + 5, 545],
    [2375 + 40 * 3 + 5, 545],
    [2375 + 40 * 4 + 5, 545],
    [2375 + 40 * 5 + 5, 545],
    [2625, 545],
    // --
    [2695 - 7 * 9, 190 + 35 * 9],
    [2695 - 7 * 8, 190 + 35 * 8],
    [2695 - 7 * 7, 190 + 35 * 7],
    [2695 - 7 * 6, 190 + 35 * 6],
    [2695 - 7 * 5, 190 + 35 * 5],
    [2695 - 7 * 4, 190 + 35 * 4],
    [2695 - 7 * 3, 190 + 35 * 3],
    [2695 - 7 * 2, 190 + 35 * 2],
    [2695 - 7 * 1, 190 + 35 * 1],
    // --
    [2695, 190],
    [2695, 5 + 30 * 5 + 2],
    [2695, 5 + 30 * 4],
    [2695, 5 + 30 * 3],
    [2695, 5 + 30 * 2],
    [2695, 5 + 30 * 1],
    // --
    [2695, 5],
    [2660, 5],
    [2625, 5],
    // --
    [2625, 5 + 32],
    [2625, 5 + 32 * 2],
    [2625, 102],
    // --
    [2375 + 40 * 5 + 5, 102],
    [2375 + 40 * 4 + 5, 102],
    [2375 + 40 * 3 + 5, 102],
    [2375 + 40 * 2 + 5, 102],
    [2375 + 40 * 1 + 5, 102],
    // --
    [2375, 102],
    [2375, 5 + 32 * 2],
    [2375, 5 + 32],
    [2375, 5],
    [2340, 5]
  ];
  for (let i = 0; i < lightLocations.length; i++) {
    state.lights.push(
      new Light(
        rad /*radius*/,
        lightLocations[i][0] /*centerX*/,
        lightLocations[i][1] /*centerY*/,
        [
          {
            color: colors[0],
            time:
              per * ((lightLocations.length - i) % (lightLocations.length / 6))
          },
          { color: colors[1], time: per },
          {
            color: colors[2],
            time:
              per *
              ((i - 1 + lightLocations.length) % (lightLocations.length / 6))
          }
        ],
        state.timeStamp
      )
    );
  }

  state.lights.push(
    new Light(
      10 /*radius*/,
      2502,
      437,
      [
        { color: "rgb(117, 255, 119)", time: 300 },
        { color: "rgb(52, 53, 54)", time: 300 }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      10 /*radius*/,
      2502 - 43,
      437 + 47,
      [
        { color: "rgb(117, 255, 119)", time: 300 },
        { color: "rgb(52, 53, 54)", time: 300 }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      10 /*radius*/,
      2502 + 40,
      437 + 47,
      [
        { color: "rgb(117, 255, 119)", time: 300 },
        { color: "rgb(52, 53, 54)", time: 300 }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      10 /*radius*/,
      2502,
      300,
      [
        { color: "rgb(252, 71, 71)", time: 300 },
        { color: "rgb(52, 53, 54)", time: 300 }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      10 /*radius*/,
      2398,
      140,
      [
        { color: "rgb(251, 241, 104)", time: 300 },
        { color: "rgb(52, 53, 54)", time: 300 }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      10 /*radius*/,
      2605,
      140,
      [
        { color: "rgb(251, 241, 104)", time: 300 },
        { color: "rgb(52, 53, 54)", time: 300 }
      ],
      state.timeStamp
    )
  );
  // -------------------
  // lights washing machine
  state.lights.push(
    new Light(
      12 /*radius*/,
      92,
      350,
      [
        { color: "rgb(251, 241, 104)", time: 300 },
        { color: "rgb(52, 53, 54)", time: 300 }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      12 /*radius*/,
      125,
      350,
      [
        { color: "rgb(251, 241, 104)", time: 300 },
        { color: "rgb(52, 53, 54)", time: 300 }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      12 /*radius*/,
      158,
      350,
      [
        { color: "rgb(251, 241, 104)", time: 300 },
        { color: "rgb(52, 53, 54)", time: 300 }
      ],
      state.timeStamp
    )
  );
  // lights parking
  per = 150;
  let color1 = "rgb(242, 249, 116)";
  let color2 = "rgb(90, 81, 201)";
  state.lights.push(
    new Light(
      10 /*radius*/,
      4800 - 1,
      290,
      [
        { color: color1, time: per },
        { color: color2, time: per * 5 }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      10 /*radius*/,
      4841,
      350,
      [
        { color: color2, time: per * 1 },
        { color: color1, time: per },
        { color: color2, time: per * 3 },
        { color: color1, time: per }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      10 /*radius*/,
      4930,
      350,
      [
        { color: color2, time: per * 2 },
        { color: color1, time: per },
        { color: color2, time: per },
        { color: color1, time: per },
        { color: color2, time: per }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      10 /*radius*/,
      4973,
      290,
      [
        { color: color2, time: per * 3 },
        { color: color1, time: per },
        { color: color2, time: per * 2 }
      ],
      state.timeStamp
    )
  );

  // lights attic
  color1 = "rgb(250, 249, 140)";
  state.lights.push(
    new Light(
      15 /*radius*/,
      4951,
      2791,
      [
        { color: color1, time: 1000 },
        { color: "rgb(23, 1, 51)", time: 40 },
        { color: color1, time: 2000 },
        { color: "rgb(23, 1, 51)", time: 40 },
        { color: color1, time: 500 },
        { color: "rgb(23, 1, 51)", time: 40 },
        { color: color1, time: 1000 },
        { color: "rgb(23, 1, 51)", time: 40 }
      ],
      state.timeStamp
    )
  );
  state.lights.push(
    new Light(
      15 /*radius*/,
      4836,
      2791,
      [
        { color: color1, time: 1000 },
        { color: "rgb(23, 1, 51)", time: 40 },
        { color: color1, time: 2000 },
        { color: "rgb(23, 1, 51)", time: 40 },
        { color: color1, time: 500 },
        { color: "rgb(23, 1, 51)", time: 40 },
        { color: color1, time: 1000 },
        { color: "rgb(23, 1, 51)", time: 40 }
      ],
      state.timeStamp
    )
  );

  // light on Toilet2
  state.lights.push(
    new Light(
      11 /*radius*/,
      118,
      2702,
      [
        { color: "rgb(251, 74, 74)", time: 500 },
        { color: "rgb(1, 6, 51)", time: 500 }
      ],
      state.timeStamp
    )
  );
  state.createBgBox(-10, 2600, 320, 320, getBoxBgStyle(srcMap1Toilet2));

  // banana after walls
  state.createBgBox(3060, 680, 100, 100, getBoxBgStyle(srcMap1Banana));
  state.createStaticBox(3060, 690, 100, 10, invisibleBoxStyle);
  state.convertLastBoxToSpring(2.5, 1);

  // fan
  state.fan = new Fan(90, 694, 2171, 2, 79, state.timeStamp, srcMap1Propeller);
}

export default LoadMap1;
export { map1Images };
