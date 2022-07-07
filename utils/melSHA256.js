function collapseArrayOfBinWords(arrayOfWords){
    let collapsedWordsArray = [];
    for(let i = arrayOfWords[0].length-1; i >= 0; i --){
        let columnSum = 0;
        arrayOfWords.forEach( (word) => columnSum += parseInt(word[i]) );
        collapsedWordsArray.push(columnSum);
    }
    return collapsedWordsArray.reverse();
}

//fundamental operations for sha256
function addArrayOfBinWords(arrayOfWords){
    //this is a novel way I came up with for doing binary math on multiple
    //binary words 'all at once'
    //we will test to make sure all entries are correct length
    //need to all be same length, or no good
    if(!arrayOfWords) return -1;
    if(arrayOfWords.length == 1) return arrayOfWords[0];
    let evaluatedBinaryString = [];
    let carryOver = 0;
    for(let i = arrayOfWords[0].length-1; i >= 0; i --){
        let columnSum = 0;
        arrayOfWords.forEach( (word) => columnSum += parseInt(word[i]) );
        columnSum += carryOver;
        //now we can evaluate for the result and next carryover value
        //we will build the result string backward, and correct before returning
        evaluatedBinaryString.push(columnSum % 2);
        carryOver = Math.floor(columnSum/2);
    }
    return evaluatedBinaryString.reverse().join('');
}

function makeSomePadding(howManyZeros){
    return Array.apply(null, Array(howManyZeros)).map(function () {return'0'}).join('');
}

function shiftRight(amount){
    let padding = makeSomePadding(amount);
    return function(word){
        let shifted = `${padding}${word.slice(0, -Math.abs(amount))}`;
        return shifted;
    }
}

function rightRotation(amount){
    return function(word){
        let newWord = word.slice(word.length - amount)+(word.slice(0, word.length - amount));
        return newWord;
    }
}

function exclusiveOr(arrayOfWords){
    let collapsedWordsArray = collapseArrayOfBinWords(arrayOfWords);
    for(let i = 0; i < collapsedWordsArray.length; i++){
        collapsedWordsArray[i] = collapsedWordsArray[i]%2;
    }
    return collapsedWordsArray;
}

//composite transformations used in sha256
function lowerCaseSigmaZero(word){
    const ROTR7 = rightRotation(7),
          ROTR18 = rightRotation(18),
          SHR3 = shiftRight(3);
    let wordArray = [ROTR7(word), ROTR18(word), SHR3(word)];
    return exclusiveOr(wordArray).join('');
}

function lowerCaseSigmaOne(word){
    const ROTR17 = rightRotation(17),
          ROTR19 = rightRotation(19),
          SHR10 = shiftRight(10);
    let wordArray = [ROTR17(word), ROTR19(word), SHR10(word)];
    return exclusiveOr(wordArray).join('');
}

function upperCaseSigmaZero(word){
    const ROTR2 = rightRotation(2),
          ROTR13 = rightRotation(13),
          ROTR22 = rightRotation(22);
    let wordArray = [ROTR2(word), ROTR13(word), ROTR22(word)];
    return exclusiveOr(wordArray).join('');
}

function upperCaseSigmaOne(word){
    const ROTR6 = rightRotation(6),
          ROTR11 = rightRotation(11),
          ROTR25 = rightRotation(25);
    let wordArray = [ROTR6(word), ROTR11(word), ROTR25(word)];
    return exclusiveOr(wordArray).join('');
}

function choice(wordArray){
    if(wordArray.length != 3){
        // console.log('Failed to pass exactly three words to the choice function');
    }
    let choiceArray = [];
    for(let i = 0; i < wordArray[0].length; i++){
        choiceArray.push(wordArray[0][i] == 1? wordArray[1][i]:wordArray[2][i]);
    }
    return choiceArray.join('');
}

function majority(wordArray){
    if(wordArray.length != 3){
        // console.log('Failed to pass exactly three words to the majority function');
    }
    let collapsedArray = collapseArrayOfBinWords(wordArray);
    let majorityArray = [];
    for(let i = 0; i < wordArray[0].length; i++){
        majorityArray.push(collapsedArray[i] > 1? 1:0);
    }
    return majorityArray.join('');
}

//---------constant generation-----------
function compilePrimes(howMany){
    let primeArray = [];
    let counter = 2;
    while(primeArray.length < howMany){
        if(isPrime(counter)){primeArray.push(counter)}
        counter ++;
    }
    return primeArray;
}

function isPrime(n){
    if(n < 2) return 0;
    for(let i = 2; i < n; i++){
        if(n % i === 0){
            return 0;
        }
    }
    return n;
}

function genCubedValues(primeNumberArray){
    let cubedConstants = [];
    primeNumberArray.forEach( (prime) => {
        cubedConstants.push( Math.cbrt(prime)
        .toString(2).split('.')[1]
        .substring(0, 32) );
    });
    return cubedConstants
}

function genSquaredValues(primeNumberArray){
    let squaredConstants = [];
    primeNumberArray.forEach( (prime) => {
        squaredConstants.push( Math.sqrt(prime)
        .toString(2).split('.')[1]
        .substring(0, 32) );
    });
    return squaredConstants
}
//-----INPUT MESSAGE HANDLING------

function convertRawMessageToBinary(inputToConvert){
    if(typeof(inputToConvert) !== 'string'){
        // console.log('please send a valid character string');
        return;
    }
    let rawInputAsBinary = ``;
    for(let i = 0; i < inputToConvert.length; i ++){
        rawInputAsBinary = rawInputAsBinary
                    .concat(inputToConvert.charCodeAt(i).toString(2).padStart(8, '0'));
    }
    return rawInputAsBinary;
}

function padAndReturnMessage(newMessage){
    //add a 1 to message and then pad with zeros until length is 448 bits
    //past the last multiple of 512
    let paddedMessage = newMessage + '1';
    //breakzone is when length%512 > 448 
    let breakZone = (paddedMessage.length%512) - 448 > 0?512 - paddedMessage.length%512:0;
    let paddingZeros = (function(paddedMessage, breakZone){
        if(breakZone){
            return makeSomePadding(breakZone + 448);
        }
        return makeSomePadding(448 - (paddedMessage.length%512)).toString();
    })(paddedMessage, breakZone);
    paddedMessage += paddingZeros;
    let encodedLength = newMessage.length.toString(2).padStart(64, '0');
    paddedMessage += encodedLength;
    return paddedMessage;
}
//-----BUILD MESSAGE BLOCK ARRAY------

function breakStringIntoChunksAsArray(desiredSizeOfChunks){
    return function(paddedMessage){
        let arrayOfChunks = [];
        for(i = 0; i < paddedMessage.length; i += desiredSizeOfChunks){
            arrayOfChunks.push(paddedMessage.slice(i, i+desiredSizeOfChunks));
        }
        return arrayOfChunks;
    }
}

function returnArrayOfMessageBlocks(paddedMessage){
    const make512BitChunks = breakStringIntoChunksAsArray(512);
    let messageBlockArray = make512BitChunks(paddedMessage);
    return messageBlockArray;
}
//-----BUILD MESSAGE SCHEDULE FOR EACH MESSAGE------

function first16WordsOfMessageSchedules(arrayOfMessages){
    const make32BitChunks = breakStringIntoChunksAsArray(32);
    let messageScheduleArray = [];
    arrayOfMessages.forEach( (individualMessage) => {
        messageScheduleArray.push(make32BitChunks(individualMessage))
    });
    return messageScheduleArray;
}

function finishBuildingMessageSchedules(partialSchedules){
    //new word at index i = σ1(i-2) + (i-7) + σ0(i-15) + (i-16)
    let fullSchedules = partialSchedules;
    fullSchedules.forEach( (individualSchedule) => {
        for(let i = 16; i < 64; i++){
            let input1 = lowerCaseSigmaOne(individualSchedule[i-2]),
                input2 = individualSchedule[i-7],
                input3 = lowerCaseSigmaZero(individualSchedule[i-15]),
                input4 = individualSchedule[i-16];
            let inputArray = [input1, input2, input3, input4];
            individualSchedule.push(addArrayOfBinWords(inputArray));
        }
    });
    return fullSchedules;
}
//-----COMPRESSION FUNCTIONS------ (H0 -> H1)

function initilizeHashValues(howManyValues){
    return genSquaredValues(compilePrimes(howManyValues));
}

function generateT1(H, word, constant){
    // T1 = Σ1(H[4]) + Ch(H[4], H[5], H[6]) + H[7] + K[0] + W[0]
    let input1 = upperCaseSigmaOne(H[4]),
        input2 = choice([H[4], H[5], H[6]]),
        input3 = H[7],
        input4 = constant,
        input5 = word;
    let inputArray = [input1, input2, input3, input4, input5];
    let t1 = addArrayOfBinWords(inputArray);
    return t1;
}

function generateT2(H){
    //temp word T2 = Σ0(H[0]) + Maj(H[0], H[1], H[2])
    let input1 = upperCaseSigmaZero(H[0]),
        input2 = majority([H[0], H[1], H[2]]);
    let inputArray = [input1, input2];
    let t2 = addArrayOfBinWords(inputArray);
    return t2;
}

function returnCompressedHashTable(H0, schedule, C) {
    let H1 = [...H0];

    //Shift H down, insert T1+T2 into a, Add T1 to e ( H[4] = H[4] + T1 )
    function shiftHDownAndModify(H1, word, constant) {
        let T1 = generateT1(H1, word, constant),
            T2 = generateT2(H1);
        H1.unshift(addArrayOfBinWords([T1, T2]));
        H1[4] = addArrayOfBinWords([H1[4], T1]);
        H1.pop();
        return H1;
    }

    function addHashTables(arrayOfTables) {
        let sumTable = [];
        arrayOfTables[0].forEach((tableRow, index) => {
            let rowsToAdd = [tableRow];
            for (i = 1; i < arrayOfTables.length; i++) {//almost got burned by the 1~not 0
                rowsToAdd.push(arrayOfTables[i][index]);
            }
            sumTable.push(addArrayOfBinWords(rowsToAdd));
        });
        return sumTable;
    }

    schedule.forEach((word, index) => {
        H1 = shiftHDownAndModify(H1, word, C[index])
    });

    H1 = addHashTables([H0, H1]);
    return H1;
}

function iterateAndCompress(H, W, K){
    //then PLEASE refactor me!

    function recurseThroughScheduleList(H, schedule, K, index = 0){
        let H0 = [...H];
        let H1 = returnCompressedHashTable(H0, schedule, K);
        if(!W[index+1]) return H1;
        return recurseThroughScheduleList(H1, W[index+1], K, index+1)
    } 
    let finalHashOutputAsBinary = recurseThroughScheduleList(H, W[0], K, 0);
    return finalHashOutputAsBinary;
}

function binaryToHex(binaryStringArray){
    let outputString = [];
    binaryStringArray.forEach( 
        (word) => {
            // console.log(word);
            outputString.push(parseInt(word, 2).toString(16).toLowerCase().padStart(8, '0'));
            // console.log(parseInt(word, 2).toString(16).toLowerCase());
        }
    );
    return outputString.join('');
}
//--------USABILITY FUNCTIONS---------

function performSHA256(inputData, dataRequestIndex = 0){
    let rawInBinary = convertRawMessageToBinary(inputData);
        if(dataRequestIndex == 1) return `rawInBinary: ${rawInBinary}`;
    let paddedMessage = padAndReturnMessage(rawInBinary);
        if(dataRequestIndex == 2) return `paddedMessage: ${paddedMessage}`;
    let messageBlocks = returnArrayOfMessageBlocks(paddedMessage);
        if(dataRequestIndex == 3) return `messageBlocks: ${messageBlocks}`;
    let messageSchedules = finishBuildingMessageSchedules(first16WordsOfMessageSchedules(messageBlocks));
        if(dataRequestIndex == 4) return messageSchedules;
    let initilizedHashValues = initilizeHashValues(8);
        if(dataRequestIndex == 5) return `initilizedHashValues: ${initilizedHashValues}`;
    let constants = genCubedValues(compilePrimes(64));
        if(dataRequestIndex == 6) return constants.toString(2);
    let finalHashAsBinary = iterateAndCompress(initilizedHashValues, messageSchedules, constants);
        if(dataRequestIndex == 7) return `finalHashAsBinary: ${finalHashAsBinary}`;
    let finalOutputDigest = binaryToHex(finalHashAsBinary);
        if(dataRequestIndex == 8) return `finalOutputDigest: ${finalOutputDigest}`;
    return finalOutputDigest;
}

module.exports = {performSHA256}