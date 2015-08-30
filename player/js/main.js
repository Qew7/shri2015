var mask = document.getElementById('mask');
var no_mask = document.getElementById('no_mask');
var player_body = document.querySelector('.player_body');
var player = document.querySelector('.player');
var play_button = document.getElementById('play_pause');
var menu_list = document.querySelectorAll('#menu li');
var input = document.createElement('input');
var openbutton = document.querySelector('button');
var cover = document.querySelector('.cover');
var time_button = document.querySelector('#time_button');
var ranges = document.querySelectorAll('.equalizer .range');
var notification = document.getElementById('notification');
var maskPosition = {};
input.type = 'file';
var paused, startedAt, pausedAt;
var buffer;
var totalTime;
var timeDrag = false;
var timePosition = 0;
var filters
var values = [];
var target = false;
var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');
var context = new AudioContext();
var filtersValue = [
	[-2.3, -1.5,    0,  2.6,  4.7,  4.7,  2.3,    0, -1.5, -2.8],
	[ 3.9,  2.8,  0.4, -2.6, -3.9, -4.4, -1.2,    2,  3.4,  4.2],
	[ 4.4,  2.6,  0.7,  1.8, -3.1, -3.1,    0,  1.5,  3.1,  3.9],
	[ 5.3,  4.4,  2.8,    2, -1.8, -1.8,    0,    2,  2.8,  3.6],
	[ 0,      0,    0,    0,    0,    0,    0,    0,    0,    0]
];

function not(m){
	notification.classList.add('view');
	notification.textContent = m;
	setTimeout(function(){
		notification.classList.remove('view');
	},4000);
}

function openFile(){
	input.click();
}

function loadTags(file){
	var path = file.urn ||file.name;
	ID3.loadTags(path, function() {
		var tags = ID3.getAllTags(path);
	   	document.querySelector('.track_info .title').innerText = tags.title;
	   	document.querySelector('.track_info .album').innerText = tags.artist+(tags.album?' — '+tags.album:'');
		document.querySelector('.track_info .file').innerText = path;
	    if(tags.picture){
			var base64String = "";
			for (var i = 0; i < tags.picture.data.length; i++)base64String+=String.fromCharCode(tags.picture.data[i]);
			cover.classList.remove('none');
			var img = "data:" + tags.picture.format + ";base64," + window.btoa(base64String);
			cover.style.backgroundImage = 'url('+images+')';
			document.querySelector('link[rel="shortcut icon"]').href = img;
	    }else{
	    	cover.classList.add('none');
	    	document.querySelector('link[rel="shortcut icon"]').href = 'favicon.ico';
	    }
	}, {
		tags: ["artist", "title", "album", "picture"],
	    dataReader: FileAPIReader(file)
	});
}

function onOpen(event){
	if(buffer)stop();
	pausedAt=0;
	buffer = false;
	var file =  event.target.type=='file'?event.target.files[0]:event.dataTransfer.files[0];
	if((/\.(mp3|wav|ogg)$/i).test(file.name)){
		event.preventDefault();
		player.classList.add('view');
		time_button.style.left =resampled=towaveheight=0;

		play_button.classList.remove('load');
		time_button.classList.remove('play');

		var x = event.clientX;
		var y = event.clientY;
		if(!event.clientX){
			var p = openbutton.getBoundingClientRect();
			x = p.left+(p.width/2);
			y = p.top+(p.height/2);
		}

	    document.body.classList.remove('file_hover');

	    maskTransform( 0,
			x-player_body.getBoundingClientRect().left,
			y-player_body.getBoundingClientRect().top
	    );

	    setTimeout(function(x, y){ return function(){
	    	mask.classList.add('anim');
	    	maskTransform(getMaskRadius(x, y));
	    }}(x, y),80);



	    var reader = new FileReader();
		reader.onload = function(e) {
		    context.decodeAudioData(e.target.result, onBufferLoad, onBufferError);
		};
		reader.readAsArrayBuffer(file);

	    loadTags(file);
	}else{
		not('Поддерживаются только форматы mp3, wav или ogg');
	}
}

maskTransform(0);

document.body.addEventListener('dragover', function(event) {
	event.preventDefault();
	player.classList.remove('view');
    document.body.classList.add('file_hover');
    mask.classList.remove('anim');
    player_body.classList.remove('shadow');
    return false;
}, false);

document.body.addEventListener('dragleave', function(event) {
	event.preventDefault();
    document.body.classList.remove('file_hover');
    return false;
}, false);

document.body.addEventListener('drop', onOpen, false);
input.addEventListener('change', onOpen, false);

function maskTransform(r,x,y){
	maskPosition.x = x||maskPosition.x;
	maskPosition.y = y||maskPosition.y;
	mask.style.height = r*2+'px';
	mask.style.width = r*2+'px';
	mask.style.borderRadius = r+'px';
	mask.style.marginLeft = -r+'px';
	mask.style.marginTop = -r+'px';
	mask.style.left = maskPosition.x+'px';
	mask.style.top = maskPosition.y+'px';
	no_mask.style.marginLeft = -maskPosition.x+r+'px';
	no_mask.style.marginTop = -maskPosition.y+r+'px';
}

function getMaskRadius(x, y){
	var p = player_body.getBoundingClientRect();
	var arr = [
		{x:p.left, y:p.top},
		{x:p.left+p.width, y:p.top},
		{x:p.left, y:p.top+p.height},
		{x:p.left+p.width, y:p.top+p.height},
	];
	for(var i=0; i<arr.length; i++)arr[i] = Math.sqrt(Math.pow(x-arr[i].x, 2)+Math.pow(y-arr[i].y, 2));
	return Math.max.apply(null, arr);
}

play_button.addEventListener("click", function(){
	if(!this.classList.contains('active')&&buffer){
		paused?play():stop();
		this.classList.add('active');
		setTimeout(function(t){ return function(){
			t.classList.remove('active');
		}}(this), 400);
	}
});

menu_button.addEventListener("click", function(){
	menu.classList.toggle('view');
});

window.addEventListener("click", function(e){
	if(e.target!=menu_button)menu.classList.remove('view');
});

for(var i=0;i<menu_list.length;i++)(function(i){
	menu_list[i].onclick = function(){
		setequalizer(i);
		for(var j=0;j<menu_list.length;j++) menu_list[j].classList.remove('active');
		menu_list[i].classList.add('active');
		menu.classList.remove('view');
	};
})(i);

/* Звук */

function onBufferLoad(b) {
    buffer = b;
    displayBuffer(buffer);
    play_button.classList.add('load');
    time_button.classList.add('play');
    play();
    totalTime = source.buffer.duration*1000;
	document.getElementById('total').textContent = toTime(totalTime);
}

function onBufferError(e) {
	console.error('onBufferError', e);
};

function toTime(s){
	var date = new Date(null);
    date.setSeconds(s/1000);
    return date.toISOString().substring(14, 19);
}

function play(){
	source = context.createBufferSource();
	source.buffer = buffer;
	paused = false;
	play_button.classList.add('pause');
	source.connect(filters[0]);
	filters[filters.length - 1].connect(context.destination);
	if (pausedAt) {
		startedAt = Date.now() - pausedAt;
		source.start(0, pausedAt / 1000);
    }
    else {
		startedAt = Date.now();
		source.start(0);
    }
}

function stop(){
	play_button.classList.remove('pause');
	if(source)source.stop(0);
	pausedAt = Date.now() - startedAt;
	paused = true;
}

var resampled = false;

function displayBuffer(buff) {
	var leftChannel = buff.getChannelData(0);
	resampled = new Float64Array(canvas.width * 6 );
	var i=0, j=0, buckIndex = 0;
	var min=1e3, max=-1e3;
	var thisValue=0, res=0;
	var sampleCount = leftChannel.length;

	for (i=0; i<sampleCount; i++) {
		buckIndex = 0 | ( canvas.width * i / sampleCount );
		buckIndex *= 6;
		thisValue = leftChannel[i];
		if (thisValue>0) {
		    resampled[buckIndex    ] += thisValue;
		    resampled[buckIndex + 1] +=1;
		} else if (thisValue<0) {
		    resampled[buckIndex + 3] += thisValue;
		    resampled[buckIndex + 4] +=1;
		}
		if (thisValue<min) min=thisValue;
		if (thisValue>max) max = thisValue;
	}

	for (i=0, j=0; i<canvas.width; i++, j+=6) {
		if (resampled[j+1] != 0) {
			resampled[j] /= resampled[j+1]; ;
		}
		if (resampled[j+4]!= 0) {
			resampled[j+3] /= resampled[j+4];
		}
	}

	for (i=0; i<leftChannel.length; i++) {
		buckIndex = 0 | (canvas.width * i / leftChannel.length );
		buckIndex *= 6;
		thisValue = leftChannel[i];
		if (thisValue>0) {
			resampled[buckIndex + 2] += Math.abs( resampled[buckIndex] - thisValue );
		} else  if (thisValue<0) {
			resampled[buckIndex + 5] += Math.abs( resampled[buckIndex + 3] - thisValue );
		}
	}
	for (i=0, j=0; i<canvas.width; i++, j+=6) {
		if (resampled[j+1]) resampled[j+2] /= resampled[j+1];
		if (resampled[j+4]) resampled[j+5] /= resampled[j+4];
	}
	towaveheight=1;
}

function setequalizer(n){
	for(var i=0; i<filters.length; i++) setRange(i, filtersValue[n][i]);
}

function setRange(id, value){
	console.log(id);
	values[id] = value;
	console.log(id);
	filters[id].gain.value = values[id];
	ranges[id].style.height = (value+12)/24*100+'%';
}

function rangeOnMove(e){
	if(target){
		var range = target.children[0];
		var li = target.getBoundingClientRect();
		var value = (((e.clientY-li.top)/li.height)-0.5)*-24;
		if(value<-12)value=-12;
		if(value>12)value=12;
		setRange(parseInt(target.getAttribute('f-id')), value);
	}
}

function createFilter(frequency) {
	var filter = context.createBiquadFilter();
	filter.type = 'peaking';
	filter.frequency.value = frequency;
	filter.Q.value = 1;
	filter.gain.value = 0;
	return filter;
}

function createFilters() {
	var frequencies = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
	filters = frequencies.map(createFilter);
	filters.reduce(function (prev, curr) {
		prev.connect(curr);
		return curr;
	});
}

function createRange(){
	var li = document.querySelectorAll('.equalizer li');
	for(var i=0; i<li.length; i++){
		li[i].setAttribute('f-id', i);
		li[i].addEventListener('mousedown', function(e){
			target = this;
			target.children[0].classList.add('noanim');
			rangeOnMove(e);
		}, false);
	}

	window.addEventListener('mouseup', function(){
		if(target)target.children[0].classList.remove('noanim');
		target = false;
	}, false);
	window.addEventListener('mousemove', rangeOnMove, false);
}

function setPosition(e){
	if(buffer){
		stop();
		pausedAt=totalTime*(timePosition/canvas.width);
		play();
	}
}

time_button.addEventListener('mousedown', function(e){
	stop()
	timeDrag = e.clientX-timePosition;
}, false);

window.addEventListener('mouseup', function(){
	if(timeDrag){
		setPosition()
	}
	timeDrag = false;
}, false);

window.addEventListener('mousemove', function(e){
	if(timeDrag){
		timePosition = e.clientX-timeDrag;
		if(timePosition>canvas.width)timePosition=canvas.width;
		if(timePosition<0)timePosition=0;
		time_button.style.left = timePosition+'px';
	}
}, false);

canvas.addEventListener('mousedown', function(e){
	stop();
	timePosition = e.clientX-canvas.getBoundingClientRect().left;
	timeDrag = e.clientX-timePosition
	time_button.style.left = timePosition+'px';
}, false);

var waveheight = 0;
var towaveheight = 0;
var waveloader = 0;

function animate(){
	if(startedAt&&Date.now()-startedAt<totalTime&&!paused&&!timeDrag){
		document.getElementById('current').textContent = toTime(Date.now() - startedAt);
		timePosition = (Date.now() - startedAt)/(totalTime)*canvas.width;
		time_button.style.left = timePosition+'px';
	}else if(startedAt&&!paused){
		timePosition = 0;
		time_button.style.left = timePosition+'px';
		pausedAt=0;
		play();
		stop();
	}

	if(resampled){
		for (var i=0; i< canvas.width; i++) {
			j=i*6;
			ctx.beginPath();
			ctx.strokeStyle = i<timePosition?'#000':'#000';
			ctx.moveTo( i  , (resampled[j] + resampled[j+2] )*60*waveheight+(canvas.height / 2));
			ctx.lineTo( i  , (resampled[j+3] - resampled[j+5] )*60*waveheight+(canvas.height / 2));
			ctx.stroke();
		}
	}else{
		waveloader+=0.03;
		var a =  Math.cos(waveloader)*canvas.width/2+canvas.width/2;
		var b =  Math.cos(waveloader-0.3)*canvas.width/2+canvas.width/2;
		ctx.fillRect(a, (canvas.height / 2)-1, -a+b, 3);
		if(waveloader-150>canvas.width)waveloader=0;
	}
	waveheight-=(waveheight-towaveheight)/10;
	requestAnimationFrame(animate);
}

createFilters();
createRange();
animate();
