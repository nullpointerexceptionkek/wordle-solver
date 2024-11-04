(async function solveWordle(keypressDelay = 500, submissionDelay = 4000) {
  // Fetch the list of words
  async function fetchWordList() {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/words/an-array-of-english-words/refs/heads/master/index.json"
      );
      if (!response.ok) {
        console.error("Failed to fetch word list:", response.statusText);
        return [];
      }
      const words = await response.json();
      return words.filter((word) => word.length === 5);//only 5 letter
    } catch (error) {
      console.error("Error:", error);
      return [];
    }
  }

  /*
Example Board"  
rows: [
    [
      { letter: "t", state: "absent" },//First guess, "t" is absent
      { letter: "a", state: "absent" }, //"a" is absent
      { letter: "l", state: "present" }, //"l" is present but wrong order
      { letter: "e", state: "absent" },
      { letter: "s", state: "absent" }
    ],
    [
      { letter: "v", state: "correct" }, //Second guess, "v" is correct
      { letter: "i", state: "absent" },
      { letter: "n", state: "correct" },
      { letter: "y", state: "absent" },
      { letter: "l", state: "correct" }
    ]
  ],
  absentLetters: ["t", "a", "e", "s", "i", "y"],//used for easy filtering
  presentLetters: ["l"],
  correctLetters: ["v", "n", "l"],
  correctPositions: []
    "v",   // "v" in pos 0
    null,
    "n",
    null,
    "l"
  ],
  presentPositions: [
    { letter: "l", position: 2 }
  ]
  */
  function parseBoard() {
    const board = document.querySelector(".Board-module_board__jeoPS");
    const rows = board.querySelectorAll(".Row-module_row__pwpBq");

    const boardData = {
      rows: [],
      absentLetters: [],
      presentLetters: [],
      correctLetters: [],
      correctPositions: Array(5).fill(null),
      presentPositions: [],
    };

    rows.forEach((row) => {
      const rowData = [];
      const tiles = row.querySelectorAll("[data-testid='tile']");
      tiles.forEach((tile, index) => {
        const letter = tile.innerText.toLowerCase();
        const state = tile.getAttribute("data-state");
        if (letter) {
          rowData.push({ letter, state });
          if (state === "absent") {
            boardData.absentLetters.push(letter);
          } else if (state === "present") {
            boardData.presentLetters.push(letter);
            boardData.presentPositions.push({ letter, position: index });
          } else if (state === "correct") {
            boardData.correctLetters.push(letter);
            boardData.correctPositions[index] = letter;
          }
        } else {
          rowData.push({ letter: "", state: "empty" });
        }
      });

      boardData.rows.push(rowData);
    });

    boardData.absentLetters = [...new Set(boardData.absentLetters)];
    boardData.presentLetters = [...new Set(boardData.presentLetters)];
    boardData.correctLetters = [...new Set(boardData.correctLetters)];

    return boardData;
  }

  // Filter the word list based on the current board state
  function filterWords(wordList, boardData) {
    return wordList.filter((word) => {
      const letters = word.split("");

      // Exclude words with letters in the same position as absent letters
      for (let i = 0; i < 5; i++) {
        const letter = letters[i];

        // Check for correct letters in the correct position
        if (
          boardData.correctPositions[i] &&
          letter !== boardData.correctPositions[i]
        ) {
          return false;
        }

        // Exclude absent letters at any position
        if (boardData.absentLetters.includes(letter)) {
          // But if the letter is marked absent but also correct or present elsewhere, skip exclusion
          if (
            !boardData.correctLetters.includes(letter) &&
            !boardData.presentLetters.includes(letter)
          ) {
            return false;
          }
        }

        // Exclude letters that are present in the same position (they should be in different positions)
        for (const present of boardData.presentPositions) {
          if (present.position === i && letter === present.letter) {
            return false;
          }
        }
      }

      // Check for letters that are present but must be in a different position
      for (const present of boardData.presentPositions) {
        if (!word.includes(present.letter)) {
          return false;
        }
        if (letters[present.position] === present.letter) {
          return false;
        }
      }

      // Ensure all correct letters are in place
      for (const [i, letter] of boardData.correctPositions.entries()) {
        if (letter && letters[i] !== letter) {
          return false;
        }
      }

      return true;
    });
  }

  // THe best wordle guess are teh words with no repeating characters, this function ranks the possible word by uniqueness
  function rankWordsByUniqueness(wordList) {
    return wordList.sort((a, b) => {
      const uniqueA = new Set(a).size;
      const uniqueB = new Set(b).size;
      return uniqueB - uniqueA;
    });
  }

  function simulateKeyPress(char) {
    const eventOptions = {
      key: char,
      code: char === "Backspace" ? "Backspace" : `Key${char.toUpperCase()}`,
      keyCode: char === "Backspace" ? 8 : char.toUpperCase().charCodeAt(0),
      which: char === "Backspace" ? 8 : char.toUpperCase().charCodeAt(0),
      bubbles: true,
      cancelable: true,
    };

    document.dispatchEvent(new KeyboardEvent("keydown", eventOptions));
    document.dispatchEvent(new KeyboardEvent("keypress", eventOptions));
    document.dispatchEvent(new KeyboardEvent("keyup", eventOptions));
  }

  //wordle does not automatically clear word after wrong guess, clear it by 5 backspaces
  async function clearInput() {
    for (let i = 0; i < 5; i++) {
      simulateKeyPress("Backspace");
      await new Promise((resolve) => setTimeout(resolve, keypressDelay / 2));
    }
  }

  //type the guesses
  async function typeWord(word, keypressDelay, submissionDelay) {
    await clearInput();
    for (let char of word) {
      simulateKeyPress(char);
      await new Promise((resolve) => setTimeout(resolve, keypressDelay));
    }

    const boardBefore = parseBoard();

    const enterEventOptions = {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
    };
    document.dispatchEvent(new KeyboardEvent("keydown", enterEventOptions));
    document.dispatchEvent(new KeyboardEvent("keypress", enterEventOptions));
    document.dispatchEvent(new KeyboardEvent("keyup", enterEventOptions));

    await new Promise((resolve) => setTimeout(resolve, submissionDelay));

    const boardAfter = parseBoard();

    //if the board did not chance, then that means the word is not in the wordle dictionary
    const boardChanged =
      JSON.stringify(boardBefore) !== JSON.stringify(boardAfter);

    return boardChanged;
  }

  const wordList = await fetchWordList(); //dictionary
  let boardData = parseBoard(); //consider existing user input
  let possibleWords = filterWords(wordList, boardData);
  let currentGuess = "tales"; //default first guess
  let isFirstAttempt = true;

  for (let attempt = 0; attempt < 6; attempt++) {
    //check if board is already filled
    const boardIsEmpty = boardData.rows.every((row) =>
      row.every((tile) => tile.state === "empty")
    );

    //do not guess tales again if the board is not empty
    if (isFirstAttempt && boardIsEmpty) {
      currentGuess = "tales";
      isFirstAttempt = false;
    } else {
      currentGuess = rankWordsByUniqueness(possibleWords)[0] || "tales";
    }

    console.log(`Attempt ${attempt + 1}: Trying "${currentGuess}"`);

    const wordAccepted = await typeWord(
      currentGuess,
      keypressDelay,
      submissionDelay
    );

    if (!wordAccepted) {
      console.log(`Word "${currentGuess}" was not accepted. Trying next word.`);
      possibleWords = possibleWords.filter((word) => word !== currentGuess);
      currentGuess = rankWordsByUniqueness(possibleWords)[0] || "tales";
      continue;
    }

    boardData = parseBoard();

    if (boardData.correctLetters.length === 5) {
      console.log("Wordle solved:", currentGuess);
      return;
    }

    possibleWords = filterWords(possibleWords, boardData);

    if (possibleWords.length === 0) {
      console.log("No possible words left to try.");
      return;
    }

    isFirstAttempt = false;
  }

  console.log("Failed to solve Wordle within 6 attempts.");
})();
