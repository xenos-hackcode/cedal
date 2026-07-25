import { auth, db } from './firebase-init.js';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

function t(key) {
  var lang = localStorage.getItem('cs-lang') || 'en';
  var dict = (window.CS_I18N && window.CS_I18N[lang]) || (window.CS_I18N && window.CS_I18N.en) || {};
  return dict[key] !== undefined ? dict[key] : key;
}

function showMessage(el, message, isError) {
  if (!el) return;
  el.textContent = message;
  el.className = isError ? 'cs-form-error cs-visible-block' : 'cs-form-success cs-visible-block';
}

function hideMessage(el) {
  if (!el) return;
  el.className = el.className.replace('cs-visible-block', '');
}

function renderNavAuth(user) {
  document.querySelectorAll('.cs-nav-auth').forEach(function (container) {
    container.innerHTML = '';
    if (user) {
      var name = document.createElement('span');
      name.className = 'cs-nav-auth-name';
      name.textContent = user.displayName || user.email;

      var logoutBtn = document.createElement('button');
      logoutBtn.type = 'button';
      logoutBtn.className = 'cs-btn cs-btn-small cs-btn-ghost';
      logoutBtn.setAttribute('data-i18n', 'auth_signout');
      logoutBtn.textContent = t('auth_signout');
      logoutBtn.addEventListener('click', function () {
        signOut(auth);
      });

      container.appendChild(name);
      container.appendChild(logoutBtn);
    } else {
      var link = document.createElement('a');
      link.href = './login.html';
      link.className = 'cs-btn cs-btn-small cs-btn-ghost';
      link.setAttribute('data-i18n', 'auth_signin');
      link.textContent = t('auth_signin');
      container.appendChild(link);
    }
  });
}

onAuthStateChanged(auth, function (user) {
  renderNavAuth(user);
  document.dispatchEvent(new CustomEvent('cs-auth-ready', { detail: { user: user } }));
});

document.addEventListener('DOMContentLoaded', function () {
  var loginForm = document.getElementById('cs-login-form');
  if (loginForm) {
    var loginMsg = document.getElementById('cs-login-message');

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideMessage(loginMsg);
      var email = document.getElementById('login-email').value.trim();
      var password = document.getElementById('login-password').value;
      var btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;

      signInWithEmailAndPassword(auth, email, password)
        .then(function () {
          var next = new URLSearchParams(window.location.search).get('next');
          window.location.href = next ? next : './index.html';
        })
        .catch(function () {
          showMessage(loginMsg, t('login_error_generic'), true);
          btn.disabled = false;
        });
    });

    var forgotLink = document.getElementById('cs-forgot-password');
    if (forgotLink) {
      forgotLink.addEventListener('click', function (e) {
        e.preventDefault();
        var email = document.getElementById('login-email').value.trim();
        if (!email) {
          showMessage(loginMsg, t('login_error_generic'), true);
          return;
        }
        sendPasswordResetEmail(auth, email)
          .then(function () {
            showMessage(loginMsg, t('login_reset_sent'), false);
          })
          .catch(function () {
            showMessage(loginMsg, t('login_error_generic'), true);
          });
      });
    }
  }

  var signupForm = document.getElementById('cs-signup-form');
  if (signupForm) {
    var signupMsg = document.getElementById('cs-signup-message');

    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      hideMessage(signupMsg);
      var name = document.getElementById('signup-name').value.trim();
      var email = document.getElementById('signup-email').value.trim();
      var password = document.getElementById('signup-password').value;
      var confirm = document.getElementById('signup-confirm').value;

      if (password !== confirm) {
        showMessage(signupMsg, t('signup_error_mismatch'), true);
        return;
      }

      var btn = signupForm.querySelector('button[type="submit"]');
      btn.disabled = true;

      createUserWithEmailAndPassword(auth, email, password)
        .then(function (cred) {
          return updateProfile(cred.user, { displayName: name }).then(function () {
            return setDoc(doc(db, 'users', cred.user.uid), {
              name: name,
              email: email,
              createdAt: serverTimestamp()
            });
          });
        })
        .then(function () {
          window.location.href = './careers.html';
        })
        .catch(function () {
          showMessage(signupMsg, t('signup_error_generic'), true);
          btn.disabled = false;
        });
    });
  }
});
