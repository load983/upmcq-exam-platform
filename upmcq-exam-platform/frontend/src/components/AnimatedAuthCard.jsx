// src/components/AnimatedAuthCard.jsx
// Reusable "diagonal sliding panel" login/signup card.
// Classes are prefixed with `aa-` so they never collide with the app's
// existing .card / .btn / .input Tailwind component classes.
import React from 'react';

export default function AnimatedAuthCard({
  active,
  loginSlot,
  signupSlot,
  welcomeTitle = 'WELCOME BACK!',
  welcomeText = '',
  joinTitle = 'JOIN US!',
  joinText = '',
}) {
  return (
    <>
      <style>{`
        .aa-wrap{ display:flex; flex-direction:column; align-items:center; justify-content:center; gap:26px; padding:36px 16px; }
        .aa-card{
          position: relative;
          width: 800px;
          max-width: 100%;
          height: 520px;
          background: #ffffff;
          border-radius: 18px;
          overflow: hidden;
          isolation: isolate;
          box-shadow: 0 30px 60px -24px rgba(15,23,42,.30), 0 6px 18px -8px rgba(15,23,42,.10);
          font-family: 'Poppins','Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
        }
        .aa-form-box{ position:absolute; top:0; height:100%; width:36%; display:flex; flex-direction:column; justify-content:center; z-index:1; overflow-y:auto; padding:24px 0; }
        .aa-login-box{ left:6%; opacity:1; pointer-events:auto; transition:opacity .28s ease .30s; }
        .aa-signup-box{ right:6%; opacity:0; pointer-events:none; transition:opacity .28s ease 0s; }
        .aa-card.active .aa-login-box{ opacity:0; pointer-events:none; transition:opacity .28s ease 0s; }
        .aa-card.active .aa-signup-box{ opacity:1; pointer-events:auto; transition:opacity .28s ease .32s; }
        .aa-form-title{ position:relative; margin:0 0 28px; font-size:26px; font-weight:600; letter-spacing:-.4px; color:#111; }
        .aa-form-title::after{ content:""; position:absolute; left:0; bottom:-9px; width:46px; height:3px; border-radius:3px; background:#132c6a; }
        .aa-field{ position:relative; margin-bottom:16px; }
        .aa-field input{ width:100%; height:46px; padding:0 26px 0 0; border:0; border-bottom:1.5px solid #dcdcdc; background:transparent; font-family:inherit; font-size:14px; color:#111; outline:none; transition:border-color .3s ease; }
        .aa-field input:focus{ border-bottom-color:#132c6a; }
        .aa-field label{ position:absolute; left:0; top:50%; transform:translateY(-50%); font-size:14px; font-weight:400; color:#a3a3a3; pointer-events:none; transition: top .25s ease, transform .25s ease, font-size .25s ease, color .25s ease, font-weight .25s ease; }
        .aa-field input:focus ~ label, .aa-field input:not(:placeholder-shown) ~ label{ top:9px; transform:translateY(-50%); font-size:11px; font-weight:500; letter-spacing:.3px; color:#132c6a; }
        .aa-field > i{ position:absolute; right:2px; top:50%; transform:translateY(-50%); font-size:13px; color:#b7b7b7; pointer-events:none; transition:color .25s ease; }
        .aa-field input:focus ~ i{ color:#132c6a; }
        .aa-btn{ width:100%; height:44px; margin-top:8px; border:0; border-radius:30px; background:#000; color:#fff; font-family:inherit; font-size:14px; font-weight:500; letter-spacing:.5px; cursor:pointer; transition:transform .25s ease, box-shadow .25s ease; }
        .aa-btn:hover{ transform:scale(1.02); box-shadow:0 12px 24px -10px rgba(0,0,0,.55); }
        .aa-btn:active{ transform:scale(.99); }
        .aa-btn:disabled{ cursor:default; opacity:.7; }
        .aa-switch{ margin:18px 0 0; font-size:12.5px; color:#8d8d8d; line-height:1.5; }
        .aa-switch a{ color:#132c6a; font-weight:600; text-decoration:none; border-bottom:1px solid transparent; transition:border-color .2s ease; cursor:pointer; }
        .aa-switch a:hover{ border-bottom-color:#132c6a; }
        .aa-error{ color:#dc2626; font-size:12.5px; margin:-6px 0 12px; }
        .aa-overlay{ position:absolute; inset:0; z-index:5; background:#000; clip-path: polygon(60% 0%, 100% 0%, 100% 100%, 40% 100%); transition: clip-path .6s cubic-bezier(.65,.05,.36,1); }
        .aa-card.active .aa-overlay{ clip-path: polygon(0% 0%, 40% 0%, 60% 100%, 0% 100%); }
        .aa-overlay-content{ position:absolute; top:0; left:62%; width:30%; height:100%; display:flex; flex-direction:column; justify-content:center; text-align:center; color:#fff; transition:left .6s cubic-bezier(.65,.05,.36,1); }
        .aa-card.active .aa-overlay-content{ left:8%; }
        .aa-overlay-content h2{ margin:0 0 12px; font-size:20px; font-weight:700; letter-spacing:.6px; }
        .aa-overlay-content p{ margin:0; font-size:12.5px; line-height:1.75; font-weight:300; color:rgba(255,255,255,.70); }

        @media (max-width:768px){
          .aa-wrap{ padding:20px 16px; gap:20px; }
          .aa-card{ display:flex; flex-direction:column; width:100%; max-width:400px; height:auto; }
          .aa-form-box{ position:relative; top:auto; left:auto; right:auto; width:100%; height:auto; padding:36px 30px 30px; opacity:1; pointer-events:auto; transition:none; }
          .aa-login-box{ display:flex; }
          .aa-signup-box{ display:none; }
          .aa-card.active .aa-login-box{ display:none; }
          .aa-card.active .aa-signup-box{ display:flex; opacity:1; }
          .aa-overlay{ position:relative; inset:auto; order:2; width:100%; height:132px; flex-shrink:0; clip-path:none; transition:none; }
          .aa-card.active .aa-overlay{ clip-path:none; }
          .aa-overlay-content, .aa-card.active .aa-overlay-content{ left:0; width:100%; padding:0 26px; transition:none; }
          .aa-overlay-content h2{ font-size:18px; }
          .aa-overlay-content p{ font-size:12px; }
          .aa-form-title{ font-size:23px; }
        }
      `}</style>

      <div className="aa-wrap">
        <div className={`aa-card${active ? ' active' : ''}`}>
          <div className="aa-form-box aa-login-box">{loginSlot}</div>
          <div className="aa-form-box aa-signup-box">{signupSlot}</div>

          <div className="aa-overlay">
            <div className="aa-overlay-content">
              <h2>{active ? joinTitle : welcomeTitle}</h2>
              <p>{active ? joinText : welcomeText}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Floating-label input field used inside the card
export function AaField({ id, label, icon, type = 'text', ...rest }) {
  return (
    <div className="aa-field">
      <input id={id} type={type} placeholder=" " {...rest} />
      <label htmlFor={id}>{label}</label>
      {icon && <i className={icon}></i>}
    </div>
  );
}
