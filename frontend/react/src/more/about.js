import React, { Component } from "react";
import { GetSpellList } from "../game/gamePlay/spells";
import { GetHeroList } from "../game/gamePlay/utils";

const aboutStyle = {
  position: "absolute",
  borderRadius: 3,
  height: 500,
  width: 1150,
  top: 50,
  left: 50,
  border: "1px solid black",
  backgroundColor: "rgba(20, 22, 42, 0.58)",
  overflow: "hidden",
  boxShadow:
    "inset 1px 1px 2px 0 white, inset -1px -1px 2px 0 white, 0px 0px 0px 35px rgb(111, 111, 111)"
};

class About extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    let spells = GetSpellList();
    return (
      <div style={aboutStyle}>
        <div
          style={{
            top: 20,
            left: "3%",
            width: "94%",
            position: "absolute",
            fontSize: "19px",
            fontFamily: "Times",
            textAlign: "left",
            overflow: "hidden",
            color: "rgb(121, 235, 133)"
          }}
        >
          <p>
            It is not clear which came first, Deadpool or Ryan Reynolds. But
            both for sure bring awesomeness to our ordinary lives. Both share
            something special. One has pretty face. The other is married to
            Blake Lively. Alongside Terrance and Philip they drive Canada's
            economy to Hollywood, and undoubtedly recover the damage done to
            every soul on the planet by Green Hornet. Or was it lantern. Sorry
            Seth Rogen.
          </p>
          <p>
            For those who still wonder what the hack is THIS even after the
            above well explanatory introduction, don't raise your hopes too
            much. Ergo, some of the answers you will understand, and some of
            them you will not. Concordantly, while your first question may be
            the most pertinent, you may or may not realize it is also the most
            irrelevant. Deadbool Arena is the sum of a remainder of an
            unbalanced equation inherent to the programming inside Google.
            Eventuality of an anomaly, which despite Sergey's and Larry's
            sincerest efforts they have been unable to eliminate from what is
            otherwise a harmony of productive work. Which has led you,
            inexorably, here.
          </p>
          <p>
            Deadbool's life started with Tiny People music video. If you still
            have not, make sure you do check it out on{" "}
            <a
              href="https://www.youtube.com/watch?v=LCmJ5mIF3GM"
              style={{ fontWeight: "bold" }}
            >
              YOUTUBE
            </a>
            .
          </p>
          <p style={{ color: "rgb(235, 213, 121)" }}>
            Last but not least. Deadbool Arena is an artistic parody. All the
            copyrighted characters (e.g., Trump) and sounds (e.g., from Worms,
            Quake, and a bunch of movies) are used purely for fun, and under the
            Fair Use doctrine. So if you are a lawyer or smth, relax, and enjoy
            the game.
          </p>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            paddingLeft: 10,
            paddingTop: 6,
            width: "100%",
            height: 83,
            overflow: "hidden",
            boxShadow: "0px 0px 10px 10px rgb(230, 252, 188)"
          }}
        >
          {GetHeroList().map(hero => (
            <div
              key={hero[0]}
              style={{
                position: "relative",
                bottom: 2,
                width: 75,
                height: 75,
                float: "left",
                backgroundImage: `url(avatars_and_guns/avatar_${hero[0]}.png)`,
                backgroundSize: "100% 100%",
                backgroundPosition: "0px 0px",
                overflow: "hidden"
              }}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default About;
