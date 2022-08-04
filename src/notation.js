let m = 10;
let t = 20;
let h = 12;
let w = 24;
let C4 = 60;
let C4Y = t + h * 6;
let noteIndexes = "ABCDEFG".split("");

function setup() {
  createCanvas(600, 400);
  background(220);

  // figure out composition
  // get smallest note duration
  let noteDurations = new Set(
    loops.flatMap((loop) => loop.melody.map((n) => n[1]))
  );
  let noteDuration = noteDurations[0]; // fix later

  // comp length
  let loopDurations = loops.map(
    (loop) => loop.startDelay + loop.melody.length * loop.repeat
  );
  let compDuration = loopDurations.sort()[loopDurations.length - 1];
  let w = (width - m * 5) / compDuration;

  // draw staff
  stroke("black");
  for (let i = 0; i < 11; i++) {
    let y = t + i * h + h;
    if (i !== 5) {
      stroke("black");
      line(m, y, width - m, y);
    } else {
      stroke("gray");
      // line(m, y, width - m, y);
    }
  }
  
  // clefs
  textSize(h * 5);
  text('𝄞', m, t + h * 4.5);
  textSize(h * 4);
  text('𝄢', m, t + h * 10.5);
  

  // draw measures
  for (let j = 0; j <= compDuration; j++) {
    if (j > 1 && j % 4 === 0) {
      let x = m*2 + w / 2 + w * j;
      stroke("black");
      fill('black');
      if (j === compDuration) {
        rect(x, t + h, 6, h * 4);
        rect(x, t + h * 7, 6, h * 4);
      } else {
        line(x, t + h, x, t + h * 5);
        line(x, t + h * 7, x, t + h * 11);
      }
    }
  }

  for (let j = 0; j < compDuration; j++) {
    let rest = [];
    let moreNotes = [];
    for (let i = 0; i < loops.length; i++) {
      let { startDelay, startIndex, doubler, repeat, melody } = loops[i];
      if (startDelay > j) continue;
      if (j > startDelay + melody.length * repeat) {
        moreNotes.push(false);
        continue;
      } else {
        moreNotes.push(true);
      }
      let loopIndex = (j - startDelay + startIndex) % melody.length;

      if (melody[loopIndex][0] !== null) {
        rest = false;
        let [note, duration] = melody[loopIndex];
        let letter = note[0];
        let number = +note[note.length - 1];
        let y =
          C4Y +
          ((2 - noteIndexes.indexOf(letter)) * h) / 2 +
          (((4 - number) * h) / 2) * 7;
        let x = m*2 + w + w * j;
        fill("black");
        noStroke();
        push();
        translate(x, y);
        rotate(-PI/6);
        ellipse(0, 0, 12, 8);
        pop();
        if (note.includes("#")) {
          textSize(18);
          text("#", x - 12, y);
        }
        if (duration.includes('4')) {
          stroke('black');
          line(x + 5, y - 1, x + 5, y - h*2);
        }
        if (y > t + h*5 && y < t + h*7) {
          line(x - 12, t + h*6, x + 12, t + h*6);
        }
        // text(note, x + 6, y + 3);
      } else {
        rest.push(i);
      }
    }
  }
}

let loops = [
  {
    startDelay: 0,
    startIndex: 4,
    doubler: false,
    repeat: 1,
    melody: [
      ["F#3", "4n"],
      ["D#3", "4n"],
      ["C#3", "4n"],
      ["G#3", "4n"],
      ["A#3", "4n"],
      ["C#4", "4n"],
      ["D#4", "4n"],
      ["F#4", "4n"],
      ["F#3", "4n"],
      ["G#4", "4n"],
      ["F#4", "4n"],
      ["G#4", "4n"],
    ],
  },
  {
    doubler: false,
    repeat: 1,
    startDelay: 4,
    startIndex: 10,
    melody: [
      ["D#4", "4n"],
      ["B3", "4n"],
      ["A#3", "4n"],
      ["F4", "4n"],
      ["F#3", "4n"],
      ["A#3", "4n"],
      ["B3", "4n"],
      ["D#5", "4n"],
      ["D#4", "4n"],
      ["F5", "4n"],
      ["D#5", "4n"],
      ["F5", "4n"],
    ],
  },
  {
    doubler: false,
    startDelay: 4,
    startIndex: 5,
    repeat: 1,
    melody: [
      ["C#4", "4n"],
      ["A#3", "4n"],
      ["G#3", "4n"],
      ["D#4", "4n"],
      ["F4", "4n"],
      ["G#3", "4n"],
      ["A#3", "4n"],
      ["C#5", "4n"],
      ["C#4", "4n"],
      ["D#5", "4n"],
      ["C#5", "4n"],
      ["D#5", "4n"],
    ],
  },
];

const MIDI_NOTES = [
  "C_1",
  "C#_1",
  "D_1",
  "D#_1",
  "E_1",
  "F_1",
  "F#_1",
  "G_1",
  "G#_1",
  "A_1",
  "A#_1",
  "B_1",
  "C0",
  "C#0",
  "D0",
  "D#0",
  "E0",
  "F0",
  "F#0",
  "G0",
  "G#0",
  "A0",
  "A#0",
  "B0",
  "C1",
  "C#1",
  "D1",
  "D#1",
  "E1",
  "F1",
  "F#1",
  "G1",
  "G#1",
  "A1",
  "A#1",
  "B1",
  "C2",
  "C#2",
  "D2",
  "D#2",
  "E2",
  "F2",
  "F#2",
  "G2",
  "G#2",
  "A2",
  "A#2",
  "B2",
  "C3",
  "C#3",
  "D3",
  "D#3",
  "E3",
  "F3",
  "F#3",
  "G3",
  "G#3",
  "A3",
  "A#3",
  "B3",
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
  "C5",
  "C#5",
  "D5",
  "D#5",
  "E5",
  "F5",
  "F#5",
  "G5",
  "G#5",
  "A5",
  "A#5",
  "B5",
  "C6",
  "C#6",
  "D6",
  "D#6",
  "E6",
  "F6",
  "F#6",
  "G6",
  "G#6",
  "A6",
  "A#6",
  "B6",
  "C7",
  "C#7",
  "D7",
  "D#7",
  "E7",
  "F7",
  "F#7",
  "G7",
  "G#7",
  "A7",
  "A#7",
  "B7",
  "C8",
  "C#8",
  "D8",
  "D#8",
  "E8",
  "F8",
  "F#8",
  "G8",
  "G#8",
  "A8",
  "A#8",
  "B8",
  "C9",
  "C#9",
  "D9",
  "D#9",
  "E9",
  "F9",
  "F#9",
  "G9",
];
