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
  BlockHeader,
  NavTitle,
  NavTitleLarge,
  Block,
  BlockTitle,
  NavRight,
  AccordionContent,
  Actions,
  ActionsButton,
  ActionsLabel,
  ActionsGroup,
  Icon
} from 'framework7-react';

import Dom7 from 'dom7';
import routes from '../js/routes';
import {SVESystemInfo, SVEAccount, LoginState, SVEToken, TokenType} from 'svebaselib';

export default class extends React.Component {
  constructor() {
    super();

    SVESystemInfo.getInstance().sources.sveService = "api";
    SVESystemInfo.getInstance().sources.authService = "auth";
    SVESystemInfo.getInstance().sources.gameService = "games";
    SVESystemInfo.getInstance().sources.aiService = "ai";

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
            clearUser: function() {
              app.state.user = undefined;
              app.setState({user: undefined});
            },
            pushRightPanel: function(content) {
              content.menueItems = content.menueItems.filter(e => e != {});
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
            },
            promptLogin: function() {
              return app.onOpenLogin();
            },
            sendRequest: function(msg) { // request to service worker
              if (app.state.activeService !== undefined)
                app.state.activeService.postMessage(msg);
            },
            selectCamera: function() {
              this.askForCameraAccess(() => {
                navigator.mediaDevices.getUserMedia({audio: false, video: true}).then(stream => {
                  navigator.mediaDevices.enumerateDevices().then(devices => {
                    devices = devices.filter(d => d.kind === "videoinput");
                    let sel = window.localStorage.getItem("cameraDevice");
                    if (sel !== undefined) {
                      let selList = devices.filter(d => app.getDeviceCaption(d) == sel);
                      if (selList.length > 0) {
                        sel = selList[0];
                      } else {
                        sel = undefined;
                      }
                    }
                    app.setState({selectDevicesInfo: {
                        selections: devices,
                        selected: sel,
                      }
                    });

                    app.setupExampleStreams();
                  });
                }, (err) => console.log("select camerra error on access stream: " + JSON.stringify(err)));
              });
            },
            askForCameraAccess: function(callback) {
              if(app.state.hasCameraPermission === true) {
                callback();
              } else {
                if(app.state.hasCameraPermission === undefined) {
                  app.$f7.dialog.confirm("Die App benötigt hier Zugriff auf Ihre Kamera.", "Kamerazugriff", () => {
                    app.state.hasCameraPermission = true;
                    app.setState({hasCameraPermission: true});
                    callback();
                  }, () => { 
                    app.state.hasCameraPermission = false;
                    app.setState({hasCameraPermission: false});
                    reject({reason: "No permission to access camera stream!"});
                  });
                } else {
                  reject({reason: "No permission to access camera stream!"});
                }
              }
            },
            getCameraStream: function(id = undefined) {
              return new Promise((resolve, reject) => {
                let createStream = () => {
                  let devID = (id !== undefined) ? id : window.localStorage.getItem("cameraDevice");
                  
                  navigator.mediaDevices.getUserMedia({audio: false, video: true}).then(stream => {
                    navigator.mediaDevices.enumerateDevices().then(devices => {
                      if (!(devID === undefined || devID === null || devID === "undefined")) {
                        if (devID.includes("id: ")) {
                          devID = devID.replace("id: ", "");
                        } else {
                          let sel = devices.filter(d => d.label == devID);
                          if (sel.length > 0) {
                            devID = sel[0].deviceId;
                          } else {
                            devID = undefined;
                          }
                        }
                      }   

                      let constraints = (devID === undefined || devID === null || devID === "undefined") ? {
                        audio: false,
                        video: ((app.$f7.device.android || app.$f7.device.ios) ? {
                          facingMode: "environment"
                        } : true)
                      } : { 
                        audio: false,
                        video: {
                          deviceId: { exact: devID }
                        }
                      };

                      //console.log("Request camera stream: " + JSON.stringify(constraints));
                      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
                        resolve(stream);
                      }, (err) => reject(err));
                    });
                  });
                };

                this.askForCameraAccess(createStream);
              });
            },
            hasCameraPermission: function() {
              return (app.state.hasCameraPermission === true);
            },
            resetCameraPermissions: function(keepAllowance = false) {
              if(!keepAllowance || app.state.hasCameraPermission === false) {
                app.state.hasCameraPermission = undefined;
                app.setState({hasCameraPermission: undefined});
              }
            },
            joinGroup: function(link) {
              let params = new Map();
              let vars = link.substring(1).split('&');
              for (var i = 0; i < vars.length; i++) {
                let pair = vars[i].split('=');
                params.set(pair[0], decodeURI(pair[1]));
              }

              if (link.includes("token=") && link.includes("context=")) {
                new SVEToken(params.get("token"), TokenType.RessourceToken, Number(params.get("context")), (token => {
                  app.$f7.toast.create({
                    text: (token.setIsValid()) ? "Beitrittslink gefunden" : "Abgelaufener Link!",
                    closeButton: true,
                    closeButtonText: (token.setIsValid()) ? 'Beitritt' : "OK",
                    closeButtonColor: (token.setIsValid()) ? 'green' : "red",
                    on: {
                      close: () => {
                        if(token.setIsValid())
                          token.use();                      
                      }
                    }
                  }).open();
                }));
              } else {
                let toast = app.$f7.toast.create({
                  text: "Found Link: " + link,
                  closeButton: false,
                  closeTimeout: 5000,
                });
                toast.open();

                if(params.has("redirectProject")) {
                  let pid = Number(params.get("redirectProject"));
                  app.$f7.view.current.router.navigate("/project/" + pid + "/");
                }
              }
            },
            getPopupComponent: function(name) {
              return app.state.popupComponent.get(name)
            },
            setPopupComponent: function(name, comp) {
              let m = app.state.popupComponent;
              m.set(name, comp);
              app.setState({popupComponent: m})
            },
            getIsMobileDataConnection: function() {
              try {
                let connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                let type = connection.NetworkInformation.type;
                return (type !== "wifi" && type !== "ethernet")
              } catch {
                return false;
              }
            },
            cleanUpLogInData: function() {
              app.cleanUpLogInData();
            },
            isDebug: function() {
              return app.state.debugMode;
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
      debugMode: false,
      error: {
        has: false,
        msg: ""
      },
      selectDevicesInfo: undefined,
      popupComponent: new Map(),
      user: undefined,
      hasCameraPermission: false,
      loginMessages: {
        errorMsg: '',
        loginType: ''
      },
      loginData: {
        username: '',
        password: '',
        password2: '',
        loginToken: '',
        joinToken: undefined,
        email: ''
      },
      openOverlay: "",
      onLoginHooks: [],
      activeService: undefined,
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
    return (this.state.error.has) ? (
      <App params={ this.state.f7params } themeDark>
        <View>
          <Page>
            <Navbar large sliding={false}>
              <NavTitle sliding>Ein kritischer Fehler trat auf!</NavTitle>
              <NavTitleLarge sliding>Ein kritischer Fehler trat auf!</NavTitleLarge>
              <NavRight>
                <Link external iconF7="text_bubble" tooltip="Fehler melden" href={"mailto:info@felixlehner.de?subject=Webseitenfehler&body=Fehler%20trat%20auf%3A%0D%0A" + this.state.error.msg.replace("\\n", "\n")} />
                <Link style={{color: "green"}} iconF7="tornado" tooltip="Fehler auflösen" onClick={() => window.location.reload()} />
              </NavRight>
            </Navbar>
            <Block>
              <p>
                Es ist ein kritischer Fehler in der Webapp aufgetreten! Dies bedeutet jedoch nicht, 
                dass die letzte Operation nicht gespeichert wurde. Auf dem Server kann alles in bester Ordnung sein.
                Dementsprechend wird niemand von diesem Fehler erfahren, wenn er nicht mit Hilfe des Sprechblasen-Icons per Mail gemeldet wird.
                Nach der Meldung kann über den Tornado hier wieder aufgeräumt werden, damit es weiter gehen kann!
                Vielen Dank für die Geduld - die App ist eben noch in der Entwicklung.
              </p>
              <List accordionList>
                <ListItem accordionItem title="Fehlermeldung">
                  <AccordionContent>
                    <Block strong inset>
                      <p>
                        {this.state.error.msg}
                      </p>
                    </Block>
                  </AccordionContent>
                </ListItem>
              </List>
            </Block>
          </Page>        
        </View>
      </App>
    ) 
    :(
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
                    style={(item.color !== undefined) ? {color: item.color} : {}}
                  />
                ))}
                <ListItem panelClose="right"/>
              </List>
            </Page>
          </View>
        </Panel>
        
        {(this.state.selectDevicesInfo !== undefined) ? 
          <Actions grid={true} ref="actionDeviceSelection" opened={this.state.selectDevicesInfo !== undefined} onActionsClosed={() => this.setState({selectDevicesInfo: undefined})}>
            <ActionsGroup>
              <ActionsLabel>Wähle Kamera (aktuell: {(this.state.selectDevicesInfo.selected !== undefined) ? this.getDeviceCaption(this.state.selectDevicesInfo.selected) : "Auto"})</ActionsLabel>
              {this.state.selectDevicesInfo.selections.map(dev => (
                <ActionsButton 
                  key={dev.deviceId}
                  onClick={() => { window.localStorage.setItem("cameraDevice", this.getDeviceCaption(dev)); }}
                >
                  <video slot="media" width="48" id={"camExample-" + dev.deviceId}></video>
                  <span>{this.getDeviceCaption(dev)}</span>
                </ActionsButton>
              ))}
              <ActionsButton color="green" onClick={() => { window.localStorage.removeItem("cameraDevice"); }}>
                <Icon slot="media" width="48" f7="sparkles"></Icon>
                <span>Auto</span>
              </ActionsButton>
              <ActionsButton color="red" close>
                <Icon slot="media" width="48" f7="arrow_down"></Icon>
                <span>Cancel</span>
              </ActionsButton>
            </ActionsGroup>
          </Actions>
        : ""}


        {/* Views/Tabs container */}
        <Views tabs className="safe-areas">
          {/* Tabbar for switching views-tabs */}
          <Toolbar tabbar labels bottom>
            <Link tabLink="#view-home" tabLinkActive iconIos="f7:photo_fill_on_rectangle_fill" iconAurora="f7:photo_fill_on_rectangle_fill" iconF7="photo_fill_on_rectangle_fill" text="SVE Media" />
            <Link tabLink="#view-catalog" iconIos="f7:arrow_up_doc_fill" iconAurora="f7:arrow_up_doc_fill" iconF7="arrow_up_doc_fill" text="SVE Documents" onClick={this.onOpenDocs.bind(this)} />
            <Link tabLink="#view-gamehub" iconIos="f7:gamecontroller_alt_fill" iconAurora="f7:gamecontroller_alt_fill" iconF7="gamecontroller_alt_fill" text="Game Hub" />
          </Toolbar>

          {/* Your main view/tab, should have "view-main" class. It also has "tabActive" prop */}
          <View id="view-home" main tab tabActive url="/" />

          {/* Catalog View */}
          <View id="view-catalog" name="catalog" tab url="/docs/" />

          {/* gamehub View */}
          <View id="view-gamehub" name="gamehub" tab url="/gamehub/" />

        </Views>

        <LoginScreen id="register-screen">
          <View>
            <Page loginScreen>
              <div
                style={{
                  backgroundImage: "url('images/SnowVision_Logo_Alpha.png')",
                  backgroundRepeat: "no-repeat",
                  backgroundAttachment: "fixed",
                  backgroundPosition: "center",
                  backgroundSize: "30%",
                  filter: "blur(20px) brightness(30%)",
                  WebkitFilter: "blur(20px) brightness(30%)",
                  boxSizing: "border-box",
                  height: "100%",
                  width: "100%",
                  zIndex: "-100",
                  position: "absolute"
                }}
              />
              <LoginScreenTitle>Register&nbsp;{this.state.loginMessages.loginType}</LoginScreenTitle>
              {(this.state.loginMessages.errorMsg.length > 0) ? (
                <BlockHeader large color="red" style={{color: "red"}}>
                  <span color="red" style={{color: "red"}}>{this.state.loginMessages.errorMsg}</span>
                </BlockHeader>
              ) : ''}
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

                {(this.state.loginData.joinToken !== undefined && !this.state.loginData.joinToken.getIsValid()) ?
                  <ListInput
                    id="regToken"
                    label="Registrierungs-Token"
                    type="text"
                    placeholder="Übermitteltes Token für die Registrierung war nicht gültig oder vorhanden"
                    disabled
                    value=""
                    onInput={(e) => {
                      
                    }}
                  />
                : 
                  (this.state.loginData.joinToken !== undefined) ? 
                    <ListItem color="green" style={{color: "green"}}><span color="green" style={{color: "green"}}>Token akzeptiert</span></ListItem>
                  : ""
                }

                <ListButton title="Register" onClick={() => this.onRegister()} />
                <ListButton title="Zurück zum Login" onClick={() => this.onOpenLogin()} />
                <BlockFooter>
                  Die App verwendet die API an: <Link external href={"https://" + window.location.hostname + "/" + SVESystemInfo.getAPIRoot() + "/check"}>{window.location.hostname + "/" + SVESystemInfo.getAPIRoot()}</Link>
                </BlockFooter>
              </List>
            </Page>
          </View>
        </LoginScreen>

        <LoginScreen id="login-screen" style={{overflow: "visible"}}>
          <View style={{overflow: "visible"}}>
            <Page loginScreen style={{overflow: "visible"}}>
              <div
                style={{
                  backgroundImage: "url('images/SnowVision_Logo_Alpha.png')",
                  backgroundRepeat: "no-repeat",
                  backgroundAttachment: "fixed",
                  backgroundPosition: "center",
                  backgroundSize: "30%",
                  filter: "blur(20px) brightness(30%)",
                  WebkitFilter: "blur(20px) brightness(30%)",
                  boxSizing: "border-box",
                  height: "100%",
                  width: "100%",
                  zIndex: "-100",
                  position: "absolute"
                }}
              />
              <LoginScreenTitle>Login&nbsp;{this.state.loginMessages.loginType}</LoginScreenTitle>
              {(this.state.loginMessages.errorMsg.length > 0) ? (
                <BlockHeader large color="red" style={{color: "red"}}>
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
              <Link iconF7="arrow_down_to_line_alt" onClick={this.updateWebapp.bind(this)} tooltip="Update WebApp" style={{position: "fixed", bottom: "2vh", right: "2vw"}}></Link>
            </Page>
          </View>
        </LoginScreen>
      </App>
    )
  }

  setupExampleStreams() {
    if (this.state.selectDevicesInfo !== undefined) {
      this.forceUpdate(() => {
        this.state.selectDevicesInfo.selections.forEach(dev => {
          this.$f7.data.getCameraStream(dev.deviceId).then((stream) => {
            let elem = document.getElementById("camExample-" + dev.deviceId);
            elem.srcObject = stream;
            elem.play();
            elem.onloadedmetadata = function(e) {
              // Ready to go. Do some stuff.
            };
          }, (err) => console.log("App Camera error: " + JSON.stringify(err)));
        });
      });
    }
  }

  getDeviceCaption(dev) {
    let name = dev.label;
    if (name === undefined || name.length == 0)
      name = "id: " + dev.deviceId;

    return name;
  }

  updateWebapp() {
    window.caches.delete("/js/app.js").then(r => {
      window.caches.delete("/").then(r => {
        window.location.reload();
      }, err => window.location.reload());
    }, err => window.location.reload());
  }

  static getDerivedStateFromError(error) {
    console.log("STATIC: Catching error!");
    return {error: {
      has: true,
      msg: "Error" + JSON.stringify(error)
    }};
  }

  componentDidCatch(error, errorInfo) {
    let errorObj = this.state.error;
    errorObj.has = true;
    errorObj.msg = errorObj.msg + "<br>\n Info: " + JSON.stringify(errorInfo) + "<br>\nError: " + JSON.stringify(error);
    this.setState({error: errorObj});
    console.log("DYNAMIC: Catching error: " + errorObj.msg);
  }

  onOpenDocs() {
    //this.$f7.data.resetCameraPermissions();
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
    var self = this;
    new SVEAccount({ name: this.state.loginData.username, pass: this.state.loginData.password}, (usr) => {
      if (this.state.saveThisDevice) {
        SVEToken.register(TokenType.DeviceToken, usr).then(token => {
          window.localStorage.setItem("sve_token", token);
          window.localStorage.setItem("sve_user", usr.getID());
          window.localStorage.setItem("sve_username", usr.getName());
        });
      }
      self.onLoggedIn(usr);
    });
  }

  onLoggedIn(usr) {
    let self = this;

    let lData = this.state.loginData;
    if (lData.joinToken !== undefined) {
      lData.joinToken.use();
      lData.joinToken = undefined;
      this.setState({loginData: lData});
    }

    if (usr.getState() == LoginState.LoggedInByToken || usr.getState() == LoginState.LoggedInByUser) {
      //console.log("Login succeeded! State: " + JSON.stringify(usr.getState()));
      self.state.user = usr;
      self.setState({user: self.state.user, openOverlay: ""});
      self.$f7.loginScreen.close();

      if(this.state.routerParams.has("redirectProject")) {
        let pid = Number(this.state.routerParams.get("redirectProject"));
        this.$f7.view.current.router.navigate("/project/" + pid + "/");
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
    this.setState({loginMessages: {errorMsg: '', loginType: this.state.loginMessages.loginType}});
    if(this.state.loginData.joinToken === undefined) {
      this.setState({loginMessages: {errorMsg: 'Für eine Registeriung muss ein Token vorhanden sein. Scanne dazu einfach einen QR-Code oder öffne einen Einladungslink.', loginType: this.state.loginMessages.loginType}});
      return;
    }
    if(this.state.loginData.password === this.state.loginData.password2) {
      SVEAccount.registerNewUser({ name: this.state.loginData.username, pass: this.state.loginData.password }, this.state.loginData.joinToken).then(usr => {
        this.onLoggedIn(usr);
      }, err => this.setState({loginMessages: {errorMsg: 'Registrierung fehlgeschlagen! Der Name scheint bereits vergeben zu sein.', loginType: this.state.loginMessages.loginType}}));
    } else {
      this.setState({loginMessages: {errorMsg: 'Die beiden Passworteingaben müssen identisch sein.', loginType: this.state.loginMessages.loginType}});
    }
  }

  cleanUpLogInData() {
    let token_str = window.localStorage.getItem("sve_token");
    if (token_str !== null && token_str !== undefined) {
      new SVEToken(token_str, TokenType.DeviceToken, Number(window.localStorage.getItem("sve_user")), token => {
        token.invalidate();
      });
    }

    window.localStorage.removeItem("sve_token");
    window.localStorage.removeItem("sve_username");
    window.localStorage.removeItem("sve_user");
    this.state.user = undefined;

    let allCookies = document.cookie.split(';');
    for (let i = 0; i < allCookies.length; i++)
        document.cookie = allCookies[i] + "=;expires=" + new Date(0).toUTCString();

    //update complete webapp
    location.reload();
  }

  checkForToken() {
    let token_str = window.localStorage.getItem("sve_token");
    if (token_str !== null && token_str !== undefined) {
      console.log("Found saved token");
      let loginData = this.state.loginData;
      loginData.username = window.localStorage.getItem("sve_username");
      new SVEToken(token_str, TokenType.DeviceToken, Number(window.localStorage.getItem("sve_user")), token => {
        loginData.loginToken = token;
        this.setState({loginData: loginData});
        if(!token.getIsValid()) {
          console.log("Device Token is not valid!");
          this.setState({loginMessages: {errorMsg: "Gepeichertes Geräte-Token ist ungültig!", loginType: this.state.loginMessages.loginType}});
          this.cleanUpLogInData();
        } else {
          this.doLogInWithToken(token);
        }
      });
      this.setState({loginData: loginData});
    }
  }

  doLogInWithToken(token) {
    this.setState({saveThisDevice: false});
    console.log("Try login as: " + this.state.loginData.username);
    console.log("Use token");
  
    token.use().then(() => {
      SVESystemInfo.getLoggedInUser().then(usr => {
        console.log("After token use logged in user: " + JSON.stringify(usr.getInitializer()));

        // correct username, since the token login does not know about it
        let uInit = usr.getInitializer();
        uInit.name = window.localStorage.getItem("sve_username");
        new SVEAccount(uInit, (newUser) => {
          this.state.user = newUser;
          let lData = this.state.loginData;
          lData.username = newUser.getName();
          this.setState({ loginData: lData, user: newUser});
          this.onLoggedIn(newUser);
        });
      }, err => {
        console.log("Login via Geräte-Token fehlgeschlagen! (Use hat funktioniert)");
        this.setState({loginMessages: {errorMsg: "Login via Geräte-Token fehlgeschlagen!", loginType: this.state.loginMessages.loginType}});
        this.onOpenLogin();
      });
      this.$f7.loginScreen.close();
      this.setState({openOverlay: ""});
    }, err => {
      console.log("Login via Geräte-Token fehlgeschlagen!");
      this.setState({loginMessages: {errorMsg: "Login via Geräte-Token fehlgeschlagen!", loginType: this.state.loginMessages.loginType}});
      this.onOpenLogin();
    });
  }

  onOpenRegister() {
    this.$f7.loginScreen.close();
    if(this.state.routerParams.has("token")) {
      new SVEToken(this.state.routerParams.get("token"), TokenType.RessourceToken, Number(this.state.routerParams.get("context")), (token) => {
        let lData = this.state.loginData;
        lData.joinToken = token;
        if(!token.getIsValid()) {
          console.log("Token is not valid!");
          this.setState({loginMessages: {errorMsg: "Einladung ist nicht mehr gültig.", loginType: this.state.loginMessages.loginType}});
        }
        this.setState({loginData: lData});
      });
    }
    this.$f7.loginScreen.open("#register-screen");
    this.setState({openOverlay: "register-screen"});
  }

  onOpenLogin(onlyIfNothingIsOpen = false) {
    if(!onlyIfNothingIsOpen || this.state.openOverlay.length === 0) {
      this.$f7.loginScreen.close();
      if(this.state.routerParams.has("token")) {
        let lData = this.state.loginData;
        new SVEToken(this.state.routerParams.get("token"), TokenType.RessourceToken, Number(this.state.routerParams.get("context")), (token) => {
          let lData = this.state.loginData;
          lData.joinToken = token;
          if(!token.getIsValid()) {
            console.log("Token is not valid!");
            this.setState({loginMessages: {errorMsg: "Einladung ist nicht mehr gültig.", loginType: this.state.loginMessages.loginType}});
          }
          this.state.loginData.joinToken = token;
          this.setState({loginData: lData});
        });
        this.setState({loginData: lData});
      }
      this.$f7.loginScreen.open("#login-screen");
      this.setState({openOverlay: "login-screen"});
    }
  }

  parseLink() {
    if(location.search.length > 1) {
      let params = new Map();
      let vars = location.search.substring(1).split('&');
      for (var i = 0; i < vars.length; i++) {
        let pair = vars[i].split('=');
        params.set(pair[0], decodeURI(pair[1]));
      }

      this.state.routerParams = params;

      if(params.has("debug")) {
        console.log("Debug mode on!");
        this.setState({debugMode: true});
      }

      if(params.has("page")) {
        console.log("Found page request: " + params.get("page"));
        if(params.get("page") === "register" || params.get("page") === "login") {
          if(params.get("page") === "register") {
            this.onOpenRegister();
          } else {
            this.onOpenLogin();
          }
        } else {
          if (params.get("page") === "404") {
            this.$f7.loginScreen.close();
            this.setState({openOverlay: ""});
          }
          this.$f7.view.current.router.navigate("/" + params.get("page") + "/");
        }
      }
    }
  }

  onWorkerMessage(msg) {
    console.log("Worker message: " + JSON.stringify(msg));
  }

  componentDidUpdate() {
    if (this.state.user === undefined) {
      this.onOpenLogin(true);
    }
  }

  componentDidMount() {
    var self = this;
    this.$f7ready((f7) => {
      if (!f7.device.standalone && f7.device.ios)
      {
        f7.dialog.confirm("Die Webapp ist noch nicht bei Ihnen installiert. Um diese App vollständig nutzen zu können installiere sie bitte.", "App ist nicht installiert", 
          () => { 
            self.$f7.view.current.router.navigate("/install/");
            self.$f7.loginScreen.close();
            self.setState({openOverlay: ""});
          },
          () => {}
        );
      }

      // listen to service worker events
      navigator.serviceWorker.addEventListener("message", (evt) => {
        self.onWorkerMessage(evt.data);
      });

      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active) {
          self.state.activeService = registration.active;
          self.$f7.data.sendRequest("Startup!");
        }
      });

      self.onOpenLogin();

      SVESystemInfo.getFullSystemState().then(state => {
        console.log("Initial SVE state: " + JSON.stringify(state));
        SVESystemInfo.getLoggedInUser().then(usr => {
          self.state.user = usr;
          let lData = this.state.loginData;
          lData.username = usr.getName();
          self.setState({ loginData: lData, user: usr});
          self.onLoggedIn(usr);
        }, err => {
          self.state.user = undefined;
          self.checkForToken();
        });

        self.parseLink();
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