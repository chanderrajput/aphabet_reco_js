try {
    var grammar = '#JSGF V1.0; grammar letters; public <letter> = Q | W | E | R | T | Y | U | I | O | P | A | S | D | F | G | H | J | K | L | Z | X | C | V | B | N | M ;'
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    var speechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
    var speechRecognitionList = new speechGrammarList();
    speechRecognitionList.addFromString(grammar, 1);
    var recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.grammars = speechRecognitionList;
} catch (e) {
    console.error(e);
    $('.no-browser-support').show();
    $('.app').hide();
}

var alphabets = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
var alphabetsHTML = '';
var hints = document.querySelector('.hints');
alphabets.forEach(function(v, i, a) {
    alphabetsHTML += '<span> ' + v + ' </span>';
});
hints.innerHTML = 'Tap/click then say: Try ' + alphabetsHTML + '.';

var noteTextarea = $('#note-textarea');
var instructions = $('#recording-instructions');
var notesList = $('ul#notes');

var noteContent = '';
var finalResult = '';

// Get all notes from previous sessions and display them.


function validate_letters_array(arr) {
    let ret = [];
    arr.forEach(e => {
        let letter = e;
        letter = letter === "0" ? "O" : letter;
        ret.push(e);
    })
    return ret;
}

function validate_letters(transcript) {
    return transcript.filter(e => e.length == 1 && alphabets.includes(e))
}

/*-----------------------------
      Voice Recognition 
------------------------------*/

// If false, the recording will stop after a few seconds of silence.
// When true, the silence period is longer (about 15 seconds),
// allowing us to keep recording even when the user pauses. 
recognition.continuous = true;
recognition.interimResults = true;

// This block is called every time the Speech APi captures a line. 
var final_transcript = " ";
recognition.onresult = function(event) {
    // event is a SpeechRecognitionEvent object.
    // It holds all the lines we have captured so far. 
    // We only need the current one.
    var current = event.resultIndex;
    var transcript = '';


    // Get a transcript of what was said.
    for (var i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
            final_transcript += event.results[i][0].transcript;
        }
        transcript += event.results[i][0].transcript;
    }
    let transcript_arr = transcript.split(/[ ]+/);
    let filtered_transcript = validate_letters(transcript_arr);
    transcript = filtered_transcript;
    if (transcript.length == 0) {
        instructions.text('I didnt recognize English letter. Please try again and speak only English Letters.');
        return;
    }

    // Add the current transcript to the contents of our Note.
    // There is a weird bug on mobile, where everything is repeated twice.
    // There is no official solution so far so we have to handle an edge case.
    var mobileRepeatBug = (current == 1 && transcript == event.results[0][0].transcript);
    if (!mobileRepeatBug) {
        noteContent = transcript;
        var finalText = "";

        noteContent.forEach(item => {
            finalText += item
        })
        if (finalText.length) {
            finalResult += finalText
            noteTextarea.val(finalText.toLowerCase());
        }

    }
};


recognition.onstart = function() {

    instructions.text('Voice recognition activated. Try speaking into the microphone.');
}

recognition.onspeechend = function() {
    // instructions.text('You were quiet for a while so voice recognition turned itself off.');
    document.getElementById("start-record-btn").innerHTML = "press to speak";
}

recognition.onerror = function(event) {
    document.getElementById("start-record-btn").innerHTML = "press to speak";

    if (event.error == 'no-speech') {
        instructions.text('No speech was detected. Try again.');
    };
}

recognition.onnomatch = function(event) {
    document.getElementById("start-record-btn").innerHTML = "press to speak";
    instructions.text('I didnt recognize that letter.');
}


/*-----------------------------
      App buttons and input 
------------------------------*/
$("recognition.onresult").change(function() {

    alert("Handler for .change() called.");
});


$('#start-record-btn').on('click', function(e) {
    document.getElementById("start-record-btn").innerHTML = "listening";
    // alert(noteContent.length);
    if (noteContent.length) {
        noteContent += '';
    }

    recognition.start();

});
$('#stop-record-btn').on('click', function(e) {
    document.getElementById("start-record-btn").innerHTML = "Press to speak";
    // alert(noteContent.length);
    recognition.stop();
});


$('#pause-record-btn').on('click', function(e) {

    document.getElementById("start-record-btn").innerHTML = "Press to speak";
    recognition.stop();
    instructions.text('Voice recognition paused.');
});

// Sync the text inside the text area with the noteContent variable.
noteTextarea.on('input', function() {
    noteContent = $(this).val();
})

$('#save-note-btn').on('click', function(e) {
    recognition.stop();

    if (!noteContent.length) {
        instructions.text('Could not save empty note. Please add a message to your note.');
    } else {
        // Save note to localStorage.
        // The key is the dateTime with seconds, the value is the content of the note.
        saveNote(new Date().toLocaleString(), noteContent);

        // Reset variables and update UI.
        noteContent = '\n';
        renderNotes(getAllNotes());
        noteTextarea.val('');
        instructions.text('Note saved successfully.');
    }

})


notesList.on('click', function(e) {
    e.preventDefault();
    var target = $(e.target);

    // Listen to the selected note.
    if (target.hasClass('listen-note')) {
        var content = target.closest('.note').find('.content').text();
        readOutLoud(content);
    }

    // Delete note.
    if (target.hasClass('delete-note')) {
        var dateTime = target.siblings('.date').text();
        deleteNote(dateTime);
        target.closest('.note').remove();
    }
});



/*-----------------------------
      Speech Synthesis 
------------------------------*/

function readOutLoud(message) {
    var speech = new SpeechSynthesisUtterance();
    // Set the text and voice attributes.
    speech.text = message;
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;

    window.speechSynthesis.speak(speech);
}



/*-----------------------------
      Helper Functions 
------------------------------*/

function renderNotes(notes) {
    var html = '';
    if (notes.length) {
        notes.forEach(function(note) {
            html += `<li class="note">
        <p class="header">
          <span class="date">${note.date}</span>
          <a href="#" class="listen-note" title="Listen to Note">Listen to Note</a>
          <a href="#" class="delete-note" title="Delete">Delete</a>
        </p>
        <p class="content">${note.content}</p>
      </li>`;
        });
    } else {
        html = '<li><p class="content">You don\'t have any notes yet.</p></li>';
    }
    notesList.html(html);
}


function saveNote(dateTime, content) {
    localStorage.setItem('note-' + dateTime, content);
}


function getAllNotes() {
    var notes = [];
    var key;
    for (var i = 0; i < localStorage.length; i++) {
        key = localStorage.key(i);

        if (key.substring(0, 5) == 'note-') {
            notes.push({
                date: key.replace('note-', ''),
                content: localStorage.getItem(localStorage.key(i))
            });
        }
    }
    return notes;
}


function deleteNote(dateTime) {
    localStorage.removeItem('note-' + dateTime);
}
