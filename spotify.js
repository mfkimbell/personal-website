var interval = 1; // query interval in seconds
var bounceInterval = 5; // label bounce interval in seconds

/*
  LOGIN: PLEASE READ CAREFULLY!
  1. open this website, login to Spotify and allow access
  https://accounts.spotify.com/authorize?response_type=code&client_id=e78cfabe95cb406da4bf49c46736b29c&scope=user-read-currently-playing%20user-read-playback-position&redirect_uri=https%3A%2F%2Fgoogle.com
  2. after logging in, you will be redirected to https://www.google.com/?code=[your code here], paste this into the 'code' variable
  3. open a browser window, open Developer Tools and switch to console
  4. open main.html
  5. after successful login, you will find a refresh token in the console, copy this into the 'refreshToken' variable so you don't have to authorize the app anew
*/
var code = 'AQDdirXEc6QY0yEd63YXncwsd9kqsEuB4Z718KyL--jk-lhKL3Xh1LuFmDTnd1nt8SFRgwHlJitZavygmYk5oSrLM0GhRURExiZ6W691UwolMfrIDlZFntNSr3LRP5pjVTvmsi7E0sA3iTggfLdlQydUmOTzMVEhOhNUMTGipl1tP8yYQLRVavLulT6RJeABye87O7BVzQRo8iGvXOU7qMClHxO7FSatLnY3dr0uMYA'; // your code from step 2

var refreshToken = ''; // your refresh token from step 5

var tokenURL = 'https://accounts.spotify.com/api/token';

var clientId = 'e78cfabe95cb406da4bf49c46736b29c';
var clientSecret = '4f2d1e19a1ad4058881b47462ba6b3b4';

var instance = this;

var refreshAccessToken = function () {
  var request = new XMLHttpRequest();
  request.open(
    'POST',
    tokenURL,
    true
  );
  var params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    redirect_uri: 'https://google.com'
  });
  request.setRequestHeader(
    'Authorization',
    'Basic ' + window.btoa(clientId + ':' + clientSecret)
  );
  request.setRequestHeader(
    'Content-Type',
    'application/x-www-form-urlencoded'
  );
  request.onload = function () {
    if (this.status == 400) {
      console.error('token refresh failed!');
      return;
    }
    var token = JSON.parse(this.response);
    instance.token.access_token = token.access_token;
    instance.token.expires_in = token.expires_in;
    if (token.refresh_token) {
      instance.token.refresh_token = token.refresh_token;
    }
  };
  request.send(params.toString());
};

if (!refreshToken) {
  var params = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: 'https://google.com'
  });
  var request = new XMLHttpRequest();
  request.open(
    'POST',
    tokenURL,
    true
  );
  request.setRequestHeader(
    'Authorization',
    'Basic ' + window.btoa(clientId + ':' + clientSecret)
  );
  request.setRequestHeader(
    'Content-Type',
    'application/x-www-form-urlencoded'
  );
  request.onload = function () {
    if (this.status == 400) {
      console.error('invalid code, please copy the login URL and try again!');
      return;
    }
    instance.token = JSON.parse(this.response);
    console.log(
      'Your refresh token is: '
      + instance.token.refresh_token
      + '.\nPlease copy it into the \'refreshToken\''
      + 'variable in main.js.'
    );
    setInterval(
      refreshAccessToken,
      (instance.token.expires_in - 60) * 1000
    );
  };
  request.send(params.toString());
} else {
  instance.token = {
    expires_in: 3600,
    refresh_token: refreshToken
  };
  refreshAccessToken();
  setInterval(
    refreshAccessToken,
    (instance.token.expires_in - 60) * 1000
  );
}

var root = document.getElementById('root');
var nowPlaying = document.getElementById('nowplaying');
var albumArt = document.getElementById('albumart');

var getRecentTracks = function () {
  if (!instance.token) {
    return;
  }
  var request = new XMLHttpRequest();
  request.open(
    'GET',
    'https://api.spotify.com/v1/me/player/currently-playing',
    true
  );
  request.setRequestHeader(
    'Authorization',
    'Bearer ' + instance.token.access_token
  );
  request.setRequestHeader('Accept', 'application/json');
  request.setRequestHeader('Content-Type', 'application/json');
  request.onload = processRecentTracks;
  request.send();
};

var processRecentTracks = function () {
  try {
    // get JSON object from API
    var data = JSON.parse(this.response);
  } catch (error) {
    return;
  }
  // return if track info is missing
  if (!data.item) return;
  // build artist(s) string
  var artists = data.item.artists[0].name;
  if (data.item.artists.length > 1) {
    for (var i = 1; i < data.item.artists.length; i++) {
      if (i < data.item.artists.length - 1) {
        artists += '</em>, <em>';
      } else {
        artists += '</em> and <em>';
      }
      artists += data.item.artists[i].name;
    }
  }
  // load album art
  albumArt.src = data.item.album.images[0].url;
  // set "now playing" label
  nowPlaying.innerHTML = (
    '<em>'
    + data.item.name
    + '</em>&nbsp;by&nbsp;<em>'
    + artists
    + '</em>'
  );
  // set progress bar
  var duration = data.item.duration_ms;
  var progress = data.progress_ms;
  var documentRoot = document.querySelector(':root');
  documentRoot.style.setProperty(
    '--progress',
    100 * progress / duration + '%'
  );  
  // animate if necessary
  var textWidth = nowPlaying.offsetWidth;
  var rootWidth = root.clientWidth;
  rootWidth -= 2 * parseFloat(getComputedStyle(root).padding);
  var documentRoot = document.querySelector(':root');
  documentRoot.style.setProperty('--textWidth', textWidth + 'px');
  documentRoot.style.setProperty('--rootWidth', rootWidth + 'px');
  if (textWidth > rootWidth) {
    nowPlaying.style.animation = 'floatText '
      + bounceInterval + 's infinite alternate ease-in-out';
  } else {
    nowPlaying.style.animation = '';
  }
}

getRecentTracks();

setInterval(
  getRecentTracks,
  interval * 1000
);