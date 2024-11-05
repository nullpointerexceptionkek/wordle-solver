# Wordle solver

This wordle solver requires no human interaction; it will automatically detect the board and input the guesses. Follow the instructions below. 

If you are interested, I also made an automatic spelling bee solver; check my repos.

![demo](/image.png)

## Instructions

Paste the entire [`paste.js`](/paste.js) into your browser console. You can open the console by pressing `F12`.

**Note:** This script is only guaranteed to work on nytimes.com and wordleunlimited.org

## Features

1. Everything is automatic
2. 99% win rate with most guesses on 4 or less, you can prob improve this by using a wordle specific dictionary

## Note
This script fetches the dictionary from a popular repo: `https://raw.githubusercontent.com/words/an-array-of-english-words/refs/heads/master/index.json`

I have no control over this repo, and you should always check if it contains the actual word list file


# algotherm
1. Always start with crane
2. always guess the word that matches the feedback with the most uniqueness and popularity
3. type the answer
4. repeat

## License

MIT License
