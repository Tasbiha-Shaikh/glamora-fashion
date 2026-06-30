import React from 'react';
import '../../styles/about.css';

const About = () => {
  return (
    <div className="about-page">
      <div className="container">
        <div className="row about-row">

          {/* TEXT SIDE */}
          <div className="col-2-about">
            <h1>About Us</h1>
            <p>
              Welcome to our world of elegance and timeless beauty. Our collection is
              carefully curated to offer a perfect blend of modern trends and classic
              designs, ensuring there is something special for everyone.
              <br /><br />

              At our store, we believe that jewelry is more than just an accessory,
              it is a symbol of expression, emotion, and identity.
              <br /><br />

              Whether you are celebrating a special occasion or simply enhancing your
              everyday look, our rings, watches, bracelets, glasses, and earrings are
              designed to add a touch of charm and confidence to your personality.
              <br /><br />

              Customer satisfaction is at the heart of everything we do. Our mission
              is to make luxury accessible, offering stylish and affordable jewelry
              that suits every taste and occasion.
              <br /><br />

              Thank you for choosing us to be a part of your journey in style and
              self-expression.🌸✨
            </p>
          </div>

          {/* VIDEO SIDE */}
          <div className="col-2-about">
            <video className="animated-video" autoPlay muted loop playsInline>
              <source src="/img/about-video.mp4" type="video/mp4" />
            </video>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;