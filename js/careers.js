import { auth, db } from './firebase-init.js';
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

var POSITIONS = [
  { id: 'buildtester', nameKey: 'position_buildtester_name', bodyKey: 'position_buildtester_body', tag: 'QA' },
  { id: 'cybersecurity', nameKey: 'position_cybersecurity_name', bodyKey: 'position_cybersecurity_body', tag: 'Security' },
  { id: 'robotics', nameKey: 'position_robotics_name', bodyKey: 'position_robotics_body', tag: 'Hardware' },
  { id: 'codingteacher', nameKey: 'position_codingteacher_name', bodyKey: 'position_codingteacher_body', tag: 'Education' },
  { id: 'securityteacher', nameKey: 'position_securityteacher_name', bodyKey: 'position_securityteacher_body', tag: 'Education' },
  { id: 'accountant', nameKey: 'position_accountant_name', bodyKey: 'position_accountant_body', tag: 'Finance' },
  { id: 'planner', nameKey: 'position_planner_name', bodyKey: 'position_planner_body', tag: 'Operations' },
  { id: 'outsider', nameKey: 'position_outsider_name', bodyKey: 'position_outsider_body', tag: 'Outreach' }
];

var PENDING_KEY = 'cs-pending-position';
var appliedPositionIds = [];
var currentUser = null;
var currentPositionId = null;

function t(key) {
  var lang = localStorage.getItem('cs-lang') || 'en';
  var dict = (window.CS_I18N && window.CS_I18N[lang]) || (window.CS_I18N && window.CS_I18N.en) || {};
  return dict[key] !== undefined ? dict[key] : key;
}

function findPosition(id) {
  for (var i = 0; i < POSITIONS.length; i++) {
    if (POSITIONS[i].id === id) return POSITIONS[i];
  }
  return null;
}

function renderPositions() {
  var grid = document.getElementById('cs-positions-grid');
  if (!grid) return;
  grid.innerHTML = '';

  POSITIONS.forEach(function (position) {
    var card = document.createElement('article');
    card.className = 'cs-product';

    var name = document.createElement('h3');
    name.className = 'cs-product-name';
    name.setAttribute('data-i18n', position.nameKey);
    name.textContent = t(position.nameKey);

    var body = document.createElement('p');
    body.className = 'cs-product-body';
    body.setAttribute('data-i18n', position.bodyKey);
    body.textContent = t(position.bodyKey);

    var meta = document.createElement('div');
    meta.className = 'cs-product-meta';
    var tag = document.createElement('span');
    tag.textContent = position.tag;
    meta.appendChild(tag);

    var actions = document.createElement('div');
    actions.className = 'cs-position-actions';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cs-btn cs-btn-small cs-btn-primary';
    btn.dataset.positionId = position.id;

    var applied = appliedPositionIds.indexOf(position.id) !== -1;
    if (applied) {
      btn.classList.add('cs-btn-disabled');
      btn.disabled = true;
      btn.setAttribute('data-i18n', 'careers_already_applied_btn');
      btn.textContent = t('careers_already_applied_btn');
    } else {
      btn.setAttribute('data-i18n', 'careers_apply_btn');
      btn.textContent = t('careers_apply_btn');
      btn.addEventListener('click', function () {
        handleApplyClick(position.id);
      });
    }
    actions.appendChild(btn);

    if (!currentUser) {
      var note = document.createElement('span');
      note.className = 'cs-position-signin-note';
      note.setAttribute('data-i18n', 'careers_signin_required');
      note.textContent = t('careers_signin_required');
      actions.appendChild(note);
    }

    card.appendChild(name);
    card.appendChild(body);
    card.appendChild(meta);
    card.appendChild(actions);
    grid.appendChild(card);
  });
}

function handleApplyClick(positionId) {
  if (!currentUser) {
    sessionStorage.setItem(PENDING_KEY, positionId);
    window.location.href = './login.html?next=careers.html';
    return;
  }
  openModal(positionId);
}

function openModal(positionId) {
  var position = findPosition(positionId);
  if (!position) return;
  currentPositionId = positionId;

  var overlay = document.getElementById('cs-apply-overlay');
  var titleEl = document.getElementById('cs-apply-position-name');
  var form = document.getElementById('cs-apply-form');
  var message = document.getElementById('cs-apply-message');

  titleEl.textContent = t(position.nameKey);
  form.reset();
  form.style.display = 'grid';
  hideMessage(message);

  overlay.classList.add('cs-open');
}

function closeModal() {
  var overlay = document.getElementById('cs-apply-overlay');
  overlay.classList.remove('cs-open');
  currentPositionId = null;
}

function hideMessage(el) {
  if (!el) return;
  el.className = el.className.replace('cs-visible-block', '');
}

function showMessage(el, message, isError) {
  if (!el) return;
  el.textContent = message;
  el.className = isError ? 'cs-form-error cs-visible-block' : 'cs-form-success cs-visible-block';
}

function sendNotificationEmail(data) {
  var cfg = window.CS_EMAILJS_CONFIG;
  if (!cfg || !window.emailjs || cfg.publicKey === 'REPLACE_ME') return Promise.resolve();
  return window.emailjs.send(cfg.serviceId, cfg.templateId, {
    to_email: cfg.toEmail,
    applicant_name: data.name,
    applicant_email: data.email,
    position: data.position,
    experience: data.experience,
    why_fit: data.whyFit,
    portfolio_link: data.portfolioLink || '(none)'
  }).catch(function () {
    // Notification email is best-effort — the application is already saved in Firestore either way.
  });
}

function loadAppliedPositions(user) {
  if (!user) {
    appliedPositionIds = [];
    return Promise.resolve();
  }
  var appsRef = collection(db, 'applications');
  var q = query(appsRef, where('uid', '==', user.uid));
  return getDocs(q).then(function (snapshot) {
    appliedPositionIds = [];
    snapshot.forEach(function (docSnap) {
      appliedPositionIds.push(docSnap.data().positionId);
    });
  }).catch(function () {
    appliedPositionIds = [];
  });
}

function initApplyForm() {
  var form = document.getElementById('cs-apply-form');
  var message = document.getElementById('cs-apply-message');
  var closeBtn = document.getElementById('cs-apply-close');
  var cancelBtn = document.getElementById('cs-apply-cancel');
  var overlay = document.getElementById('cs-apply-overlay');
  if (!form) return;

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!currentUser || !currentPositionId) return;

    var position = findPosition(currentPositionId);
    var experience = document.getElementById('apply-experience').value.trim();
    var whyFit = document.getElementById('apply-whyfit').value.trim();
    var portfolioLink = document.getElementById('apply-portfolio').value.trim();
    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    var data = {
      uid: currentUser.uid,
      name: currentUser.displayName || '',
      email: currentUser.email || '',
      position: t(position.nameKey),
      positionId: position.id,
      experience: experience,
      whyFit: whyFit,
      portfolioLink: portfolioLink,
      submittedAt: serverTimestamp()
    };

    addDoc(collection(db, 'applications'), data)
      .then(function () {
        return sendNotificationEmail(data);
      })
      .then(function () {
        appliedPositionIds.push(position.id);
        form.style.display = 'none';
        showMessage(message, t('apply_success_body'), false);
        renderPositions();
      })
      .catch(function () {
        showMessage(message, t('apply_error_generic'), true);
        submitBtn.disabled = false;
      });
  });
}

function resumePendingApplication() {
  var pending = sessionStorage.getItem(PENDING_KEY);
  if (pending && currentUser) {
    sessionStorage.removeItem(PENDING_KEY);
    openModal(pending);
  }
}

document.addEventListener('cs-auth-ready', function (e) {
  currentUser = e.detail.user;
  loadAppliedPositions(currentUser).then(function () {
    renderPositions();
    resumePendingApplication();
  });
});

document.addEventListener('DOMContentLoaded', function () {
  renderPositions();
  initApplyForm();
});
