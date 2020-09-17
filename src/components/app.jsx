import React from 'react';

import {
  App,
  Panel,
  Views,
  View,
  Toggle,
  Page,
  Navbar,
  Toolbar,
  Link,
  LoginScreen,
  LoginScreenTitle,
  List,
  ListItem,
  ListInput,
  ListButton,
  BlockFooter,
  BlockHeader
} from 'framework7-react';

import Dom7 from 'dom7';
import routes from '../js/routes';
import {SVESystemInfo, SVEAccount, LoginState} from 'svebaselib';

export default class extends React.Component {
  constructor() {
    super();

    SVESystemInfo.getInstance().sources.sveService = "api";

    var app = this;

    this.state = {
      // Framework7 Parameters
      f7params: {
        name: 'sve-online', // App name
        theme: 'auto', // Automatic theme detection
        id: "sve.felixlehner.de",
        version: "1.0.0",
        iosTranslucentBars: true,
        externalLinks: ".external",
        statusbar: {
          iosOverlaysWebview: true,
        },
        touch: {
          fastClicksExclude: "label.checkbox, label.radio, button"
        },
        notification: {
          title: 'SVE Media',
          closeTimeout: 3000,
        },

        // App root data
        data: function () {
          return {
            addLoginHook: function(hook) {
              app.state.onLoginHooks.push(hook);
            },
            getUser: function() {
              return app.state.user;
            },
            pushRightPanel: function(content) {
              app.state.panelMenueContent.push(content);
              app.setState({panelMenueContent: app.state.panelMenueContent});
            },
            popRightPanel: function() {
              app.state.panelMenueContent.pop();
              app.setState({panelMenueContent: app.state.panelMenueContent});
            },
            updateLeftPanel: function(content) {
              app.setState({panelMenueContentLeft: content});
            },
            getRouterParams: function() {
              return app.state.routerParams;
            }
          }
        },

        // App routes
        routes: routes,
        // Register service worker
        serviceWorker: {
          path: '/service-worker.js',
        },
      },
      user: undefined,
      loginMessages: {
        errorMsg: '',
        loginType: ''
      },
      loginData: {
        username: '',
        password: '',
        password2: '',
        loginToken: '',
        joinToken: '',
        email: ''
      },
      openOverlay: "",
      onLoginHooks: [],
      routerParams: new Map(),
      panelMenueContentLeft: undefined,
      panelMenueContent: [{
        caption: "_",
        menueItems: [
          {
            caption: "test",
            onClick: function() { self.dialog.alert("Test"); }
          }
        ]
      }]
    }
  }
  render() {
    return (
      <App params={ this.state.f7params } themeDark>

        {/* Right panel with cover effect*/}
        <Panel right cover themeDark>
          <View>
            <Page>
              <Navbar title={`${this.getUpperMenuePanelData(this.state.panelMenueContent).caption}`}/>
              <List>
                {this.getUpperMenuePanelData(this.state.panelMenueContent).menueItems.map((item) => (
                  <ListItem 
                    panelClose="right"
                    title={item.caption}
                    onClick={() => {
                      var click = item.onClick.bind(this);
                      click();
                      this.$f7.panel.close("right", true);
                      this.$f7.panel.close("left", true);
                    }}
                    className="button"
                  />
                ))}
                <ListItem panelClose="right"/>
              </List>
            </Page>
          </View>
        </Panel>


        {/* Views/Tabs container */}
        <Views tabs className="safe-areas">
          {/* Tabbar for switching views-tabs */}
          <Toolbar tabbar labels bottom>
          <Link tabLink="#view-home" tabLinkActive iconIos="f7:photo_fill_on_rectangle_fill" iconAurora="f7:photo_fill_on_rectangle_fill" iconF7="photo_fill_on_rectangle_fill" text="SVE Media" />
            <Link tabLink="#view-catalog" iconIos="f7:arrow_up_doc_fill" iconAurora="f7:arrow_up_doc_fill" iconF7="arrow_up_doc_fill" text="SVE Documents" />
            <Link tabLink="#view-settings" iconIos="f7:gear" iconAurora="f7:gear" iconMd="material:settings" text="Settings" />
          </Toolbar>

          {/* Your main view/tab, should have "view-main" class. It also has "tabActive" prop */}
          <View id="view-home" main tab tabActive url="/" />

          {/* Catalog View */}
          <View id="view-catalog" name="catalog" tab url="/docs/" />

          {/* Settings View */}
          <View id="view-settings" name="settings" tab url="/settings/" />

        </Views>

        <LoginScreen id="register-screen">
          <View>
            <Page loginScreen>
              <LoginScreenTitle>Register&nbsp;{this.state.loginMessages.loginType}</LoginScreenTitle>
              <List>
              <ListInput
                  label="Username"
                  type="text"
                  placeholder="Username"
                  value={this.state.loginData.username}
                  onInput={(e) => {
                    let lData = this.state.loginData;
                    lData.username = e.target.value;
                    this.setState({loginData: lData});
                  }}
                  required
                ></ListInput>

                <ListInput
                    label="Password"
                    type="password"
                    placeholder="Dein Passwort"
                    value={this.state.loginData.password}
                    onInput={(e) => {
                      let lData = this.state.loginData;
                      lData.password = e.target.value;
                      this.setState({loginData: lData});
                    }}
                    required
                />
                <ListInput
                    label="Password wiederholen"
                    type="password"
                    placeholder="Dein Passwort wiederholt"
                    value={this.state.loginData.password2}
                    onInput={(e) => {
                      let lData = this.state.loginData;
                      lData.password2 = e.target.value;
                      this.setState({loginData: lData});
                    }}
                    required
                />

                <ListInput
                    label="E-Mail (optional)"
                    type="email"
                    placeholder="Deine E-Mail"
                    value={this.state.loginData.email}
                    onInput={(e) => {
                      let lData = this.state.loginData;
                      lData.email = e.target.value;
                      this.setState({loginData: lData});
                    }}
                />

                {(this.state.loginData.joinToken.length == 0) ? (
                  <ListInput
                    id="regToken"
                    label="Registrierungs-Token"
                    type="text"
                    placeholder="Übermitteltes Token für die Registrierung"
                    value={this.state.loginData.joinToken}
                    onInput={(e) => {
                      let lData = this.state.loginData;
                      lData.joinToken = e.target.value;
                      this.setState({loginData: lData});
                    }}
                    required
                  />
                ) : (
                  <ListItem color="green"><span color="green">Token akzeptiert</span></ListItem>
                )}

                <ListButton title="Register" onClick={() => this.onRegister()} />
                <ListButton title="Zurück zum Login" onClick={() => this.onOpenLogin()} />
                <BlockFooter>
                  Die App verwendet die API an: <Link external href={"https://" + window.location.hostname + "/" + SVESystemInfo.getAPIRoot() + "/check"}>{window.location.hostname + "/" + SVESystemInfo.getAPIRoot()}</Link>
                </BlockFooter>
              </List>
            </Page>
          </View>
        </LoginScreen>

        <LoginScreen id="login-screen">
          <View>
            <Page loginScreen>
              <div 
                style={{
                  backgroundImage: "url('images/SnowVision_Logo_Alpha.png')",
                  backgroundRepeat: "no-repeat",
                  backgroundAttachment: "fixed",
                  backgroundPosition: "center",
                  backgroundSize: "80%",
                  filter: "blur(25px)",
                  WebkitFilter: "blur(25px)",
                  boxSizing: "border-box",
                  height: "100%",
                  zIndex: "-100",
                  position: "absolute"
                }}
              />
              <LoginScreenTitle>Login&nbsp;{this.state.loginMessages.loginType}</LoginScreenTitle>
              {(this.state.loginMessages.errorMsg.length > 0) ? (
                <BlockHeader large color="red" style={{background: "transparent", color: "red"}}>
                  <span color="red" style={{color: "red"}}>{this.state.loginMessages.errorMsg}</span>
                </BlockHeader>
              ) : ''}
              
              <List form>
              <ListInput
                label="Username"
                type="text"
                placeholder="Dein Username"
                value={this.state.loginData.username}
                onInput={(e) => {
                  let lData = this.state.loginData;
                  lData.username = e.target.value;
                  this.setState({loginData: lData});
                }}
                required
              ></ListInput>
              <ListInput
                label="Password"
                type="password"
                placeholder="Dein Passwort"
                value={this.state.loginData.password}
                onInput={(e) => {
                  let lData = this.state.loginData;
                  lData.password = e.target.value;
                  this.setState({loginData: lData});
                }}
                required
              />
              <ListItem>
                <span color="#008c0e">Dieses Gerät merken</span>
                <Toggle
                  color="#11a802"
                  onToggleChange={(e) => { this.setState({saveThisDevice: e}) }}
                />
              </ListItem>
              </List>
              <List>
                <ListButton title="Login" onClick={() => this.onLogin()} />
                <ListButton title="Register" onClick={() => this.onOpenRegister()} />
                <BlockFooter>
                  Die App verwendet die API an: <Link external href={"https://" + window.location.hostname + "/" + SVESystemInfo.getAPIRoot() + "/check"}>{window.location.hostname + "/" + SVESystemInfo.getAPIRoot()}</Link>
                </BlockFooter>
              </List>
            </Page>
          </View>
        </LoginScreen>
      </App>
    )
  }

  getUpperMenuePanelData(stack) {
    return (stack.length > 0) ? stack[stack.length - 1] : {
      menueItems: [],
      caption: ""
    };
  }

  onPressEnter(event) {
    if (this.$f7.user === undefined) {
      if(event.keyCode === 13) {
        if (this.state.openOverlay === "login-screen") {
          this.onLogin();
        }
        if (this.state.openOverlay === "register-screen") {
          this.onRegister();
        }
      }
      else
      {
        var self = this;
        Dom7(document).once("keydown", function(e) {
          self.onPressEnter(e);
        });
      }
    }
  }

  onLogin() {
    this.setState({loginMessages: {errorMsg: '', loginType: this.state.loginMessages.loginType}});
    console.log("Try login..");
    var self = this;
    new SVEAccount({ name: this.state.loginData.username, pass: this.state.loginData.password}, (usr) => {
      self.onLoggedIn(usr);
    });
  }

  onLoggedIn(usr) {
    if (usr.getState() == LoginState.LoggedInByToken || usr.getState() == LoginState.LoggedInByUser) {
      console.log("Login succeeded! State: " + JSON.stringify(usr.getState()));
      self.state.user = usr;
      self.setState({user: self.state.user, openOverlay: ""});
      self.$f7.loginScreen.close();

      location.search = "";
      if(this.state.routerParams.has("redirectProject")) {
        let pid = Number(this.state.routerParams.get("redirectProject"));
        this.$f7router.navigate("/project/" + pid + "/");
      }

      self.state.onLoginHooks.forEach(h => h());
    } else {
      Dom7(document).once("keydown", function(e) {
        self.onPressEnter(e);
      });
      
      if (usr.getState() == LoginState.NotLoggedIn) {
        self.setState({loginMessages: {errorMsg: 'Es konnte kein Account mit diesen Daten gefunden werden.', loginType: this.state.loginMessages.loginType}});
      } else {
        self.setState({loginMessages: {errorMsg: 'SVE Serverfehler! (' + JSON.stringify(usr) + ')', loginType: this.state.loginMessages.loginType}});
      }
    }
  }

  onRegister() {

  }

  checkForToken() {
    let token = window.localStorage.getItem("sve_token");
    if (token !== null && token !== undefined) {
      console.log("Found saved token");
      let loginData = this.state.loginData;
      loginData.username = window.localStorage.getItem("sve_user");
      loginData.loginToken = token;
      this.setState({loginData: loginData});
  
      this.doLogInWithToken(loginData.username, token);
    }
  }

  doLogInWithToken(user, token) {
    var self = this;
    this.setState({saveThisDevice: false});
    console.log("Try login as: " + user);
    console.log("Use token");
  
    new SVEAccount({
      name: user,
      token: token
    }, (usr) => {
      self.onLoggedIn(usr);
    }, err => {
      let lData = self.state.loginMessages;
      lData.errorMsg = "Login by token at server failed: " + JSON.stringify(err), "Login Error!";
      self.setState({loginMessages: lData});
      this.onOpenLogin();
    });
  }

  onOpenRegister() {
    this.$f7.loginScreen.close();
    if(this.state.routerParams.has("token")) {
      let lData = this.state.loginData;
      lData.joinToken = this.state.routerParams.get("token");
      this.setState({loginData: lData});
    }
    this.$f7.loginScreen.open("#register-screen");
    this.setState({openOverlay: "register-screen"});
  }

  onOpenLogin() {
    this.$f7.loginScreen.close();
    if(this.state.routerParams.has("token")) {
      let lData = this.state.loginData;
      lData.joinToken = this.state.routerParams.get("token");
      this.setState({loginData: lData});
    }
    this.$f7.loginScreen.open("#login-screen");
    this.setState({openOverlay: "login-screen"});
  }

  parseLink() {
    if(location.search.length > 1) {
      let params = new Map();
      let vars = location.search.substring(1).split('&');
      for (var i = 0; i < vars.length; i++) {
        let pair = vars[i].split('=');
        params.set(pair[0], decodeURI(pair[1]));
      }

      console.log("Route internal page: " + location.search);

      this.state.routerParams = params;

      if(params.has("page")) {
        console.log("Found page request: " + params.get("page"));
        if(params.get("page") !== "register" && params.get("page") !== "login") {
          if(params.get("page") !== "register") {
            this.onOpenRegister();
          } else {
            this.onOpenLogin();
          }
        } else {
          this.$f7router.navigate("/" + params.get("page") + "/");
        }
      }
    }
  }

  componentDidMount() {
    var self = this;
    this.$f7ready((f7) => {
      console.log("App ready!");
      if (!f7.device.standalone && f7.device.ios)
      {
        f7.dialog.confirm("Die Webapp ist noch nicht bei Ihnen installiert. Um diese App vollständig nutzen zu können installiere sie bitte.", "App ist nicht installiert", function() { router.navigate("/install/"); }, function() {});
      }

      SVESystemInfo.getFullSystemState().then(state => {
        if(state.user === undefined) {
          self.state.user = undefined;
          this.checkForToken();
        } else {
          self.state.user = state.user;
          self.setState({ loginData: { username: state.user.getName(), password: '', loginToken: '' }, user: state.user});
        }

        this.parseLink();
      }, err => {
        console.log("Error on init: " + JSON.stringify(err));
        f7.dialog.alert("Der SVE Server ist nicht erreichbar! Bitte mit dem Admin kontakt aufnehmen.", "Server nicht erreichbar!");
      });
    });

    Dom7(document).once("keydown", function(e) {
      self.onPressEnter(e);
    });
  }
}