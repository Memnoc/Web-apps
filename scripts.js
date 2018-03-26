(function() {
  // 'use strict';

  var SUBDOMAIN = '';
  var REDIRECT_URL = '';
  var CLIENT_ID = '';

  var ticket_result = null;

  $('#get-btn').click(getTicket);

  var url = window.location.href;
  if (url.indexOf(REDIRECT_URL) !== -1) {
    if (url.indexOf('access_token=') !== -1) {
      var access_token = readUrlParam(url, 'access_token');
      localStorage.setItem('zauth', access_token);
      var ticket_id = localStorage.getItem('ticket_id');
      document.getElementById('ticket-id').value = ticket_id;
      window.location.hash = "";
      makeRequest(access_token, ticket_id);
    }

    if (url.indexOf('error=') !== -1) {
      var error_desc = readUrlParam(url, 'error_description');
      var msg = 'Authorization error: ' + error_desc;
      showError(msg);
    }
  }

  function getTicket() {
    var ticket_id = $('#ticket-id').val();
    if ((!ticket_id) || isNaN(ticket_id)) {
      showError('Oops, the field value should be a ticket id.');
      return;
    }
    if (localStorage.getItem('zauth')) {
      var access_token = localStorage.getItem('zauth');
      makeRequest(access_token, ticket_id);
    } else {
      localStorage.setItem('ticket_id', ticket_id);
      startAuthFlow();
    }
  }

  function startAuthFlow() {
    var endpoint = 'https://'+ SUBDOMAIN +'.zendesk.com/oauth/authorizations/new';
    var url_params = '?response_type=token' +
    '&redirect_uri='+ REDIRECT_URL +
    '&client_id='+ CLIENT_ID +
    '&scope=' + encodeURIComponent('read write');
    window.location = endpoint + url_params;
  }

  function makeRequest(token, ticket_id) {
    $.ajax({
      url: 'https://'+ SUBDOMAIN +'.zendesk.com/api/v2/tickets/'+ ticket_id +'.json',
      secure: true,
      headers: {
        'Authorization': "Bearer "+ token
      },
      method: 'GET'
    })
    .done(function(response) {
      ticket_result = Object.assign({}, response.ticket);
      $('#subject span').text(ticket_result.subject);
      $('#status span').text(ticket_result.status);
      $('#created_at span').text(ticket_result.created_at);
      $('#description span').text(ticket_result.description);
      $('#details').removeClass('hidden');
    })
    .fail(function(error) {
      console.log(error)
      if(error.status === 0) {
        showError('There was a problem with the request. Make sure you\'re an agent or admin in Zendesk Support.');
      } else {
        showError('Oops, the request returned \"' + error.status + ' ' + error.statusText + '\".');
      }
    });
  }

  function showError(msg) {
    $('#error-msg').text(msg);
    $('#error-msg').removeClass('hidden');
  }

  function readUrlParam(url, param) {
    param += '=';
    if (url.indexOf(param) !== -1) {
      var start = url.indexOf(param) + param.length;
      var value = url.substr(start);
      if (value.indexOf('&') !== -1) {
        var end = value.indexOf('&');
        value = value.substring(0, end);
      }
      return value;
    } else {
      return false;
    }
  }
})();