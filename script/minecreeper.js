var EMPTY = 0; //Konstanten für leeres Feld bzw. Mine
var MINE = 99;

var field; //Variable für das zweidimensionale Array, das die Minen speichert.
var firstClick = true; //Zeigt an, ob schon einmal geklickt wurde
var xDimen = -1; //Variablen für die x- und y-Dimension, da es unterschiedlich große Felder möglich sind
var yDimen = -1;
var mines = -1; //Variablen für die anzahl der minen
var timerVar = null; //Variablen für den Timer

function init(xDim, yDim, numMines) { //wird in der onclick-Funkion der Buttons mit x- und y-Größe und der anzahl der minen aufgerufen                       
	if (timerVar != null) window.clearInterval(timerVar); //Zeit stoppen
	time = 0;  
	if (xDimen != xDim || yDimen != yDim) { //neues Spiel hat eine andere Größe
		xDimen = xDim;
		yDimen = yDim;
		clearTable();
		createTable();
	} else {
		resetTable(); //gleiche größe
	}
	firstClick = true;
	mines = numMines;
	field = createArray();
	generateMines(numMines);
	calculateNumbers();
	$('head').src = './bilder/steve_head.png'; //Kopf zurücksetzen
	$('mines_left').textContent = numMines;    //Minenzahl anzeigen
	$('timer').textContent = '000';
}

function click(element) { //Click-Funktion
	if (!element || element.classList.contains('clicked') || element.classList.contains('flag'))
		return; //Funktion soll nur mit Feldern aufgerufen werden, die existieren, noch nicht angeklickt sind und keine Flagge haben
		
	var x = parseInt(element.dataset.x); //x und y von den daten
	var y = parseInt(element.dataset.y);
	if (firstClick) { 
		firstClick = false;
		if (isMine(x, y)) { //Beim ersten klick darf keine Mine sein, deshalb muss
			generateMines(1); //eine neue Mine generiert werden,
			field[x][y] = EMPTY; //Die Angeckilckte Mine gelöscht werden, und dann
			calculateNumbers(); //Alle Zahlen neu berechnet werden
		}
		timerVar = setInterval(timer, 1000); //Timer starten (alle 1000 ms)
	}
	if (isMine(x, y)) {
		gameOver(); //Ween man eine Mine anklickt, ist game over
	} else {
		element.classList.add('clicked');
		element.classList.remove('showCracks');
		var text = field[x][y]; //Zahl aus dem Feld suchen
		element.classList.add('num_' + text); // "num_" und Zahl als Klasse zuweisen -> passender hintergrund
		if (text == 0) text = '\xA0'; // 0 durch &nbsp; Leerzeichen ersetzen
		element.textContent = text; //Zahl als Text setzen
		if (isEmpty(x, y)) { //Für ein leeres Feld solle alle angrenzenden Felder angeclickt werden 
			clickNeighbors(x, y);
		}
	}
	hasWon(); //Überprüfe, ob das Spiel gewonnen wurde
}

function clickNeighbors(x, y) { //klicke alle Nachbarn an, die keine Minen sind
	//oben
	if (!isMine(x-1, y)) {
		click(getElementFromXY(x-1, y));
	}
	//oben rechts
	if (!isMine(x-1, y+1)) {
		click(getElementFromXY(x-1, y+1));
	}
	//rechts
	if (!isMine(x, y+1)) {
		click(getElementFromXY(x, y+1));
	}
	//unten rechts
	if (!isMine(x+1, y+1)) {
		click(getElementFromXY(x+1, y+1));
	}
	//unten
	if (!isMine(x+1, y)) {
		click(getElementFromXY(x+1, y));
	}
	//unten links
	if (!isMine(x+1, y-1)) {
		click(getElementFromXY(x+1, y-1));
	}
	//links
	if (!isMine(x, y-1)) {
		click(getElementFromXY(x, y-1));
	}
	//links
	if (!isMine(x-1, y-1)) {
		click(getElementFromXY(x-1, y-1));
	}
}

function hasWon() { //Überprüfung, ob das Spiel gewonnen wurde
	var won = true;
	//var cells = $('table');
	for (var i = 0, row; row = table.rows[i]; i++) {
		for (var j = 0, cell; cell = row.cells[j]; j++) {
			//Es darf nur Felder geben, die entweder angeklickt oder eine flagge haben
			if (!cell.classList.contains('clicked')) {
				if (!cell.classList.contains('flag')) {
					won = false;
				}
			}
		}
	}
	console.log(won);
	if (won) {
		alert('You won!'); //Hinweis, wenn das Spiel gewonnen ist;
	}
}

function rightClick(element) { //Rechtsclick-Funktion: Fackel setzen bzw. entfernen
	//if (!element.classList.contains('showCracks')) { //nur noch nicht angeclickte Zellen dürfen angeklickt werden
		
		var imgtag;
		if (!element.firstChild) { //noch nie eine Fackel auf dieses Feld gesetzt:
			var imgtag = document.createElement('img'); //Neues img-Tag erzeugen
			imgtag.src = './bilder/torch.png';
			imgtag.alt = '';
			element.appendChild(imgtag) //img-Tag in die Zelle setzen
		} else {
			imgtag = element.firstChild; //andernfalls ist imgtag das erste Kindelement
		}
		
		if (element.classList.toggle('flag')) {
			imgtag.classList.add('visible'); //visibility vom imgtag umschalten
			--mines;
		} else {
			imgtag.classList.remove('visible');
			++mines;
		}
		
		$('mines_left').textContent = mines;
		hasWon(); //überprüfung, ob der Spieler gewonnen hat
	//}
	return false; //block default right click
}

function calculateNumbers() { //Alle Nummern berechnen. Die Nummern entsprechen der Anzahl der Minen in den umliegenden Feldern
	var table = $('table');
	for (var i = 0, row; row = table.rows[i]; i++) {
	   for (var j = 0, cell; cell = row.cells[j]; j++) {
			if (!isMine(i, j)) { //Es sollen nur für Felder Zahlen berechnet werden, die keine Mine sind
				field[i][j] = calculateNumberFor(i, j);
			}
		}
	}
}

function calculateNumberFor(x, y) { //Berechnet eine Zahl fürdas Feld mit den angegebenen x- und y-Koordinaten
	var num = 0; //Variable für die Zahl
	//Prüfung aller umliegenden Felder
	//oben links
	if (isMine(x-1, y-1)) {
		num++;
	}
	//links
	if (isMine(x, y-1)) {
		num++;
	}
	//links unten
	if (isMine(x+1, y-1)) {
		num++;
	}
	//oben
	if (isMine(x-1, y)) {
		num++;
	}
	//unten
	if (isMine(x+1, y)) {
		num++;
	}
	//oben rechts
	if (isMine(x-1, y+1)) {
		num++;
	}
	//rechts
	if (isMine(x, y+1)) {
		num++;
	}
	//unten rechts
	if (isMine(x+1, y+1)) {
		num++;
	}
	
	return num;
}

var time = 0;
function timer() {
	if (time < 999) {
		var s = ('00' + ++time).slice(-3); //zeit als dreistellige Zahl anzeigen
		$('timer').textContent = s;
	}
}

function gameOver() {
	window.clearInterval(timerVar);
	alert('Mine!');
	var table = $('table');
	for (var i = 0, row; row = table.rows[i]; i++) {
	   for (var j = 0, cell; cell = row.cells[j]; j++) {
			//remove clicks
			cell.onclick = function() {}; //Click- und Rechtsclick-Funktion löschen
			cell.oncontextmenu = function() {return false;}; 
			//TNT anzeigen, Fackeln ausblenden
			if (isMine(i, j)) {
				cell.classList.add('tnt'); //auf jeder Mine TNT anzeigne
				cell.classList.remove('flag');
				
				if(cell.firstChild) { //img-tag löschen
					cell.removeChild(cell.firstChild); 
				}
			}
			cell.classList.remove('showCracks');
			if (cell.classList.contains('flag')) {
				cell.firstChild.src = './bilder/barrier.png'; //Falsch gesetzte Fackeln durch dieses Bild ersetzen
			}
		}
	}
	$('head').src = './bilder/creeper_head.png' //Kopf ändern
}

function isMine(x, y) {
	try {
		return (field[x][y] == MINE);
	} catch(e) { //Wenn das Feld nicht existiert, ist da auch keine Mine
		//console.log(e);
		return false;
	}
}

function isEmpty(x, y) {
	try {
		return (field[x][y] == EMPTY);
	} catch(e) { //Wenn das Feld nicht existiert, ist das auch nicht leer
		//console.log(e);
		return false;
	}
}

function createArray() {
    var arr = new Array(xDimen); //neues Array
	
    for (var i = 0; i<arr.length; i++) {
		arr[i] = new Array(yDimen); //in jedes Element ein weiteres Array erzeugen
		arr[i] = new Array(yDimen).fill(EMPTY); //Mit dem Wert EMPTY füllen
	}
	
	return arr;
}

function clearTable() { //Tabelle wird geleert
	var table = $('table');
	while (table.firstChild) { //solange in der tabelle tr-Elemente sind, diese löschen
		table.removeChild(table.firstChild);
	}
}

function createTable() {
	var table = $('table');
	
	for (var i=0; i<xDimen; i++) {
		var row = table.insertRow(i); //entsprechend der x-Größe Zeilen erzeugen
		
		for (var j=0; j<yDimen; j++) {
			var cell = row.insertCell(j); //Zellen ind der Zeile erzeugen
			
			cell.classList.add('size_' + yDimen); //Zellen erhalten size_y-Klasse, damit bei einem kleinen Feld die Zellen kleiner angezeigt werden können
			cell.classList.add('showCracks'); //Zellen sind noch nicht angeklickt -> Erdtextur
			
			cell.id = 100 * i + j; //ids verteilen: erste Zeile: 0 - 29, zwiete Zeile: 100 - 129 etc.
			cell.dataset.x = i; //Data-Attribute, um ein parsen von x und y aus der id zu verhindern
			cell.dataset.y = j;
			
			cell.onclick = function() {click(this);}; //Click-Funktion zuweisen
			cell.oncontextmenu = function() {
				rightClick(this); //Rechtslick-Funktion zuweisen
				return false; //standard-rechtsklick blockieren
			};
		}
	}
}

function resetTable() {
	var cells = $('table').getElementsByTagName('td'); //td-Elemente suchen
	for (var i = 0; i < cells.length; i++) {
		cells[i].classList.remove('flag', 'tnt', 'clicked'); //Alle Klassen entfernen
		cells[i].classList.add('showCracks');
		for (var j = 0; j < 9; j++) {
			cells[i].classList.remove('num_' + j);
		}
		cells[i].textContent = ''; //Text zurücksetzn
		cells[i].onclick = function() {click(this);}; //Click-Function zuweisen
		cells[i].oncontextmenu = function() { //Rechtsclick-Funktion zuweisen
			rightClick(this);
			return false; //standard rechtsclick blockieren
		};
	}
}

function generateMines(count) { //Minen erzeugen
	for (var i=0; i<count; i++) {
		var x, y;
		do {
			x = ~~(Math.random() * xDimen); //Zweimal alle Bits umkehren ist schneller als Math.floor()
			y = ~~(Math.random() * yDimen);
		} while (isMine(x, y))
		field[x][y] = MINE;
	}
}

//Hilfsfunktionen für bessere Übersichtlichkeit und Lesbarkeit
function $(id) {
	return document.getElementById(id);
}

function getElementFromXY(x, y) {
	x = parseInt(x);
	y = parseInt(y);
	return $(100*x+y);
}