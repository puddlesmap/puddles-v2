/**
 * Puddles Sheet API — deploy as a Web App bound to the Events Data spreadsheet.
 *
 * Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment →
 * Web app → Execute as: Me → Who has access: Anyone → copy the /exec URL into
 * GOOGLE_APPS_SCRIPT_URL (Netlify) and vite dev env.
 *
 * Actions (JSON POST body):
 *   { action: 'appendSubmission', payload: { ... } }
 *   { action: 'updateSubmissionStatus', payload: { id, status } }
 *   { action: 'promoteSubmission', payload: { id } }
 *   { action: 'updateEventStatus', payload: { id, status } }
 *   { action: 'notifyDuplicates', payload: { subject, body, clusterCount?, to? } }
 *   { action: 'notifyAdminReviewFlags', payload: { subject, body, flagCount?, to? } }
 */

var SUBMISSIONS_SHEET = 'Submissions';
var EVENTS_SHEET = 'Events';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var result = handleAction(body.action, body.payload || {});
    return jsonOutput({ ok: true, result: result });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err.message || err) });
  }
}

function doGet() {
  return jsonOutput({ ok: true, service: 'Puddles Sheet API', version: 3 });
}

function jsonOutput(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  );
}

function handleAction(action, payload) {
  switch (action) {
    case 'appendSubmission':
      return appendSubmission(payload);
    case 'updateSubmissionStatus':
      return updateSubmissionStatus(payload);
    case 'promoteSubmission':
      return promoteSubmission(payload);
    case 'updateEventStatus':
      return updateEventStatus(payload);
    case 'notifyDuplicates':
      return notifyDuplicates(payload);
    case 'notifyAdminReviewFlags':
      return notifyAdminReviewFlags(payload);
    default:
      throw new Error('Unknown action: ' + action);
  }
}

function getWorkbook() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getSheetByName(name) {
  var sheet = getWorkbook().getSheetByName(name);
  if (!sheet) throw new Error('Sheet not found: ' + name);
  return sheet;
}

function normalizeHeader(value) {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function getHeaders(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  return sheet
    .getRange(1, 1, 1, lastCol)
    .getValues()[0]
    .map(function (cell) {
      return String(cell).trim();
    });
}

function headerIndexMap(headers) {
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    var key = normalizeHeader(headers[i]);
    if (key && map[key] === undefined) map[key] = i;
  }
  return map;
}

function findHeaderIndex(map, aliases) {
  for (var i = 0; i < aliases.length; i++) {
    var idx = map[normalizeHeader(aliases[i])];
    if (idx !== undefined) return idx;
  }
  return -1;
}

function ensureHeader(sheet, headerName) {
  var headers = getHeaders(sheet);
  var map = headerIndexMap(headers);
  if (map[normalizeHeader(headerName)] !== undefined) return headers;
  var col = headers.length + 1;
  sheet.getRange(1, col).setValue(headerName);
  return getHeaders(sheet);
}

function rowArrayFromMap(headers, valuesByHeader) {
  var row = new Array(headers.length);
  for (var i = 0; i < headers.length; i++) row[i] = '';
  for (var header in valuesByHeader) {
    if (!valuesByHeader.hasOwnProperty(header)) continue;
    var idx = -1;
    for (var j = 0; j < headers.length; j++) {
      if (normalizeHeader(headers[j]) === normalizeHeader(header)) {
        idx = j;
        break;
      }
    }
    if (idx >= 0) row[idx] = valuesByHeader[header];
  }
  return row;
}

function appendRow(sheetName, valuesByHeader) {
  var sheet = getSheetByName(sheetName);
  var headers = getHeaders(sheet);
  var row = rowArrayFromMap(headers, valuesByHeader);
  sheet.appendRow(row);
  return sheet.getLastRow();
}

function findSubmissionRow(submissionId) {
  var sheet = getSheetByName(SUBMISSIONS_SHEET);
  var headers = getHeaders(sheet);
  var map = headerIndexMap(headers);
  var idCol = findHeaderIndex(map, ['submission id']);
  if (idCol < 0) throw new Error('Submissions sheet missing Submission ID column');

  var lastRow = sheet.getLastRow();
  for (var r = 2; r <= lastRow; r++) {
    var cell = sheet.getRange(r, idCol + 1).getValue();
    if (String(cell).trim() === String(submissionId).trim()) {
      return { sheet: sheet, headers: headers, map: map, row: r };
    }
  }
  throw new Error('Submission not found: ' + submissionId);
}

function readSubmissionRecord(found) {
  var width = found.headers.length;
  var values = found.sheet.getRange(found.row, 1, found.row, width).getValues()[0];
  var record = {};
  for (var i = 0; i < found.headers.length; i++) {
    record[found.headers[i]] = values[i];
  }
  return record;
}

function setCellByAliases(found, aliases, value, required) {
  var idx = findHeaderIndex(found.map, aliases);
  if (idx < 0) {
    if (required) throw new Error('Column not found: ' + aliases.join(', '));
    return;
  }
  found.sheet.getRange(found.row, idx + 1).setValue(value);
}

function getField(record, aliases) {
  for (var key in record) {
    if (!record.hasOwnProperty(key)) continue;
    var normalized = normalizeHeader(key);
    for (var i = 0; i < aliases.length; i++) {
      if (normalized === normalizeHeader(aliases[i])) return String(record[key] || '').trim();
    }
  }
  return '';
}

function generateSubmissionId() {
  return (
    'sub-' +
    new Date().toISOString().slice(0, 10) +
    '-' +
    Utilities.getUuid().slice(0, 8)
  );
}

function generateEventId() {
  return 'puddles-' + Utilities.getUuid().slice(0, 12);
}

function formatSubmittedDate() {
  return Utilities.formatDate(new Date(), 'America/Los_Angeles', 'M/d/yyyy h:mm a');
}

function toSheetDate(isoDate) {
  if (!isoDate) return '';
  var m = String(isoDate).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return isoDate;
  return parseInt(m[2], 10) + '/' + parseInt(m[3], 10) + '/' + m[1];
}

function toSheetDateTime(isoDate, time24) {
  if (!isoDate) return '';
  var datePart = toSheetDate(isoDate);
  if (!time24) return datePart;
  var parts = String(time24).split(':');
  var hour = parseInt(parts[0], 10);
  var min = parts[1] || '00';
  var ampm = hour >= 12 ? 'PM' : 'AM';
  var hour12 = hour % 12 || 12;
  return datePart + ' ' + hour12 + ':' + min + ' ' + ampm;
}

function ensureSubmissionHeaders(sheet) {
  var headers = [
    'Event Type',
    'Age Range',
    'Cost Type',
    'Cost Detail',
    'Signup Requirement',
    'Signup Link / Info',
    'Event Description',
    'Parent-to-Parent Tips',
    'Submitted By Email',
    'Requested Location',
    'Source Context',
    'Selected City',
  ];
  for (var i = 0; i < headers.length; i++) {
    ensureHeader(sheet, headers[i]);
  }
}

function normalizeAgeRangeForEvents(ageRange) {
  if (!ageRange) return '';
  return String(ageRange).replace(/\u2013/g, '-').trim();
}

function buildPromotedDescription(eventDescription, parentTips, signupReq, signupLink) {
  var parts = [];
  if (eventDescription) parts.push(eventDescription);
  if (parentTips) parts.push('Parent tips: ' + parentTips);
  var signup = [signupReq, signupLink].filter(Boolean).join(' \u2014 ');
  if (signup) parts.push('Sign-up: ' + signup);
  return parts.join('\n\n');
}

function appendSubmission(payload) {
  var sheet = getSheetByName(SUBMISSIONS_SHEET);
  ensureSubmissionHeaders(sheet);

  var id = generateSubmissionId();
  var submittedAt = payload.submittedAt || formatSubmittedDate();
  var submissionType = payload.submissionType || 'Event';
  var status = 'New';
  var costType = payload.costType || '';
  var costDetail = payload.costDetail || '';

  var values = {
    'Submission ID': id,
    'Submitted Date': submittedAt,
    'Submission Type': submissionType,
    Status: status,
    'Event Type': payload.eventType || '',
    'Event Name': payload.eventName || '',
    'Location Name': payload.locationName || '',
    Address: payload.address || '',
    City: payload.city || '',
    Date: payload.date || '',
    'Start Time': payload.startTime || '',
    'End Time': payload.endTime || '',
    'Age Range': payload.ageRange || '',
    'Cost Type': costType,
    'Cost Detail': costDetail,
    Cost: costType === 'Free' ? 'Free' : costDetail || costType,
    'Signup Requirement': payload.signupRequirement || '',
    'Signup Link / Info': payload.signupLinkInfo || '',
    'Event Description': payload.eventDescription || '',
    'Parent-to-Parent Tips': payload.parentTips || '',
    'Category / Types': payload.types || '',
    Link: payload.link || '',
    'Additional Info': payload.parentTips || payload.additionalInfo || '',
    'Internal Notes': payload.internalNotes || '',
    'Converted Event ID': '',
    'Submitted By Email': payload.submittedByEmail || '',
    'Requested Location':
      payload.requestedLocation || payload.locationName || payload.city || '',
    'Source Context': payload.sourceContext || payload.additionalInfo || '',
    'Selected City': payload.selectedCity || '',
  };

  appendRow(SUBMISSIONS_SHEET, values);
  return { id: id, status: status, submittedAt: submittedAt };
}

function updateSubmissionStatus(payload) {
  if (!payload.id) throw new Error('Missing submission id');
  if (!payload.status) throw new Error('Missing status');

  var found = findSubmissionRow(payload.id);
  setCellByAliases(found, ['status'], payload.status, true);
  return { id: payload.id, status: payload.status };
}

function findEventRow(eventId) {
  var sheet = getSheetByName(EVENTS_SHEET);
  var headers = getHeaders(sheet);
  var map = headerIndexMap(headers);
  var idCol = findHeaderIndex(map, ['event id', 'softr record id']);
  if (idCol < 0) throw new Error('Events sheet missing Event ID column');

  var lastRow = sheet.getLastRow();
  for (var r = 2; r <= lastRow; r++) {
    var cell = sheet.getRange(r, idCol + 1).getValue();
    if (String(cell).trim() === String(eventId).trim()) {
      return { sheet: sheet, headers: headers, map: map, row: r };
    }
  }
  throw new Error('Event not found: ' + eventId);
}

function updateEventStatus(payload) {
  if (!payload.id) throw new Error('Missing event id');
  if (!payload.status) throw new Error('Missing status');

  var found = findEventRow(payload.id);
  setCellByAliases(found, ['status'], payload.status, true);
  return { id: payload.id, status: payload.status };
}

function notifyDuplicates(payload) {
  var to = String((payload && payload.to) || 'puddlesmap@gmail.com').trim();
  var subject = String((payload && payload.subject) || '').trim();
  var body = String((payload && payload.body) || '').trim();
  var clusterCount = payload && payload.clusterCount;

  if (!to) throw new Error('Missing email recipient');
  if (!subject) throw new Error('Missing email subject');
  if (!body) throw new Error('Missing email body');

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: body,
  });

  return {
    sent: true,
    to: to,
    clusterCount: clusterCount || null,
  };
}

function notifyAdminReviewFlags(payload) {
  var to = String((payload && payload.to) || 'puddlesmap@gmail.com').trim();
  var subject = String((payload && payload.subject) || '').trim();
  var body = String((payload && payload.body) || '').trim();
  var flagCount = payload && payload.flagCount;

  if (!to) throw new Error('Missing email recipient');
  if (!subject) throw new Error('Missing email subject');
  if (!body) throw new Error('Missing email body');

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: body,
  });

  return {
    sent: true,
    to: to,
    flagCount: flagCount || null,
  };
}

function promoteSubmission(payload) {
  if (!payload.id) throw new Error('Missing submission id');

  var found = findSubmissionRow(payload.id);
  var record = readSubmissionRecord(found);
  var status = getField(record, ['status']);
  var submissionType = getField(record, ['submission type']);

  if (submissionType && submissionType.toLowerCase() !== 'event') {
    throw new Error('Only Event submissions can be sent to the Events tab');
  }
  if (status !== 'Approved') {
    throw new Error('Submission must be Approved before sending to Events tab');
  }

  var existingConverted = getField(record, ['converted event id']);
  if (existingConverted) {
    throw new Error('Submission already sent to Events tab (' + existingConverted + ')');
  }

  var eventId = generateEventId();
  var title = getField(record, ['event name']);
  var venue = getField(record, ['location name']);
  var address = getField(record, ['address']);
  var city = getField(record, ['city']);
  var date = getField(record, ['date']);
  var startTime = getField(record, ['start time']);
  var endTime = getField(record, ['end time']);
  var link = getField(record, ['link']);
  var eventDescription = getField(record, ['event description']);
  var parentTips = getField(record, ['parent-to-parent tips', 'parent tips']);
  var signupReq = getField(record, ['signup requirement']);
  var signupLink = getField(record, ['signup link / info']);
  var ageRange = normalizeAgeRangeForEvents(getField(record, ['age range']));
  var eventType = getField(record, ['event type']);
  var internalNotes = getField(record, ['internal notes']);
  var promotedDescription = buildPromotedDescription(
    eventDescription || getField(record, ['additional info']),
    parentTips,
    signupReq,
    signupLink,
  );
  var costType = getField(record, ['cost type']);
  var costDetail = getField(record, ['cost detail']);
  var cost =
    costType === 'Free'
      ? 'Free'
      : costDetail || costType || getField(record, ['cost']);
  var types = getField(record, ['category / types', 'category', 'types']);
  if (!types && eventType) types = eventType;

  var eventsSheet = getSheetByName(EVENTS_SHEET);

  var eventValues = {
    'Event ID': eventId,
    Title: title,
    TItle: title,
    'Event description': promotedDescription,
    Venue: venue || address,
    Address: address || venue,
    City: city,
    'Event Date': toSheetDate(date),
    'Start DateTime': toSheetDateTime(date, startTime),
    'End DateTime': toSheetDateTime(date, endTime || startTime),
    'Event URL': link || '#',
    Cost: cost,
    'Age Tags Clean': ageRange,
    'Category Tags': types,
    Status: 'Draft',
    Approved: 'FALSE',
    Source: 'Puddles Share Form',
    'Imported at': formatSubmittedDate(),
    Notes: internalNotes,
  };

  appendRow(EVENTS_SHEET, eventValues);

  setCellByAliases(found, ['status'], 'Added to sheet', true);
  setCellByAliases(found, ['converted event id'], eventId, true);

  return { submissionId: payload.id, eventId: eventId, status: 'Added to sheet' };
}
