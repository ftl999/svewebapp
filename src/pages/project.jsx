import React from 'react';
import { PhotoBrowser, Toggle, Swiper, SwiperSlide, Page, Navbar, Popup, Block, Row, NavRight, Link, Panel, View, List, ListInput, BlockTitle, Icon, ListItem, Col, Preloader, ListButton, Button, f7, BlockFooter, AccordionContent, BlockHeader } from 'framework7-react';
import Dom7 from 'dom7';
//import KeepScreenOn from 'react-native-keep-screen-on'

//import MapView from 'react-native-maps';
import {SVEGroup, SVEProject, SVEProjectState, SVEDataType, SVEDataVersion, SVESystemInfo, SVEData, SVEProjectType} from 'svebaselib';
import UploadDropzone from './UploadDropzone';
import MediaGallery, {Media, Sorting} from './MediaGallery';
import NewProjectPopup from "./NewProjectPopup"

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      displayCount: 10,
      selectedGalleryImg: 0,
      project: Number(props.f7route.params.id),
      sortBy: Sorting.AgeASC,
      selectedImg: '',
      maxPreViewCount: 10,
      currentPreViewIdx: 0,
      selectedVid: '',
      showMap: false,
      selectedImgUser: "",
      showUpload: false,
      closeProject: false,
      selectSplash: false,
      images_toPreSelect: [],
      showPreSelect: false,
      ownerName: '',
      resultURI: undefined,
      resultType: "",
      resultPosterURI: "",
      lastLatestID: 0,
      isTakingPlaceNow: false,
      viewableUsers: new Map() //Map<User, Image[]>,
    };
  }
  render() {
      return (
      <Page name="project" onPageBeforeRemove={this.onPageBeforeRemove.bind(this)} id="page">
        <Navbar title={(typeof this.state.project !== "number") ? this.state.project.getName() : ""} backLink="Back">
          <NavRight>
            <Link iconIos="f7:menu" iconAurora="f7:menu" iconMd="material:menu" panelOpen="right" />
          </NavRight>
        </Navbar>

        <Block strong>
          {(!this.$f7.device.desktop) ? (
            <Row id="indexImage" style={{display: "flex", justifyContent: "center", alignContent: "center"}}>
              <img src={(typeof this.state.project !== "number") ? this.state.project.getSplashImageURI() : ""} style={{maxHeight: "30vh", width: "auto", display: "inherit"}}/>
            </Row>
          ) : ""}
          
          <Row>
            Gegründet von {this.state.ownerName}
          </Row>
          {(typeof this.state.project !== "number" && this.state.project.getDateRange() !== undefined && this.state.project.getDateRange().begin !== undefined && this.state.project.getDateRange().end !== undefined) ? (
            <Row style={{display: "block"}}>
              <p style={{color: (this.state.isTakingPlaceNow) ? "#11a802" : "#FFFFFF"}}>Zeitraum: {this.state.project.getDateRange().begin.toLocaleDateString()} bis {this.state.project.getDateRange().end.toLocaleDateString()}</p>
            </Row>
          ) : ""}
          {(this.state.resultURI !== undefined) ? 
            <Row id="video-row" style={{display: "flex", justifyContent: "center", alignContent: "center"}}>
              <video 
                playsInline
                controls
                preload={(this.$f7.data.getIsMobileDataConnection()) ? "none" : "auto"} 
                style={{maxHeight: "30vh", width: "auto"}} 
                poster={this.state.resultPosterURI}
              >
                <source src={this.state.resultURI} type={this.state.resultType} />
                <p>Dieser Browser unterstützt HTML5 Video nicht</p>
              </video>
            </Row>
          : ""}
          
          <Row style={{display: "flex", justifyContent: "center", alignContent: "center", width: "100%"}}>
            <List id="SortByList" accordionList largeInset style={{width: "90%"}}>
              <ListItem accordionItem title={"Sortierung: " + this.getReadableSortName(this.state.sortBy)}>
                <AccordionContent id="SortByAccordion">
                  <List>
                    <ListItem name="sort-radio" radio title="Alter absteigend" onClick={this.setSortBy.bind(this, Sorting.AgeDESC)}></ListItem>
                    <ListItem name="sort-radio" radio title="Alter aufsteigend" defaultChecked onClick={this.setSortBy.bind(this, Sorting.AgeASC)}></ListItem>
                    <ListItem name="sort-radio" radio title="Upload absteigend" onClick={this.setSortBy.bind(this, Sorting.UploadDESC)}></ListItem>
                    <ListItem name="sort-radio" radio title="Upload aufsteigend" onClick={this.setSortBy.bind(this, Sorting.UploadASC)}></ListItem>
                  </List>
                </AccordionContent>
              </ListItem>
            </List>
          </Row>
        </Block>

        <Block strong>
          {(this.state.viewableUsers.size === 0) ? (
            <Block strong style={{justifyContent: "center", justifyItems: "center", position: "fixed", zIndex: "9", left: "50%", top: "50%", transform: "translate(-50%, -50%)"}}>
              <Row><Col></Col><Col><span>Lade Medien...</span></Col><Col></Col></Row>
              <Row>
                <Col></Col><Col><Preloader></Preloader></Col><Col></Col>
              </Row>
            </Block>
           ) : (
          <Swiper 
            id="ImgSwiper"
            navigation={true}
            pagination={true}
            init={true}
            style={{display: "flex", flexFlow: "column", height: "100%"}}
          >
            {(this.state.viewableUsers.has(this.$f7.data.getUser().getName())) ? (
              <SwiperSlide className="scrollBox" style={{height: this.getSwiperHeight() + "px"}}>
                  <MediaGallery 
                    id={`image-gallery-${this.$f7.data.getUser().getName()}`}
                    data={this.getImagesFor(this.$f7.data.getUser().getName())}
                    sortBy={this.state.sortBy}
                    enableDeletion={true}
                    enableFavorization={true}
                    style={{width: "100%", height: "100%"}}
                    displayCount={this.state.displayCount}
                    enableClassification={this.state.project.getType() !== SVEProjectType.Vacation}
                  />
              </SwiperSlide>
            ) : ""}
            {this.getListFromMap(this.state.viewableUsers).map((v) => (v.key !== this.$f7.data.getUser().getName()) ? (
              <SwiperSlide 
                style={{height: this.getSwiperHeight() + "px"}}
                className="scrollBox"
                id={v.key}
              >
                <Row>
                  <BlockTitle medium>{v.key}</BlockTitle>
                </Row>
                <Row>
                  <MediaGallery
                    id={`image-gallery-${v.key}`}
                    data={this.getImagesFor(v.key)}
                    sortBy={this.state.sortBy}
                    enableDeletion={false}
                    enableFavorization={false}
                    style={{width: "100%", height: "100%"}}
                    displayCount={this.state.displayCount}
                  />
                </Row>
              </SwiperSlide>
            ) : "")}
          </Swiper>
          )}
        </Block>

        <Popup className="image-upload" swipeToClose opened={this.state.showUpload} onPopupClosed={() => this.setState({showUpload : false, closeProject: false})}>
          <Page>
            <BlockTitle large style={{justifySelf: "center"}}>Medien auswählen</BlockTitle>
            {(typeof this.state.project !== "number") ? 
              <UploadDropzone
                project={this.state.project}
                onImageUploaded={(img) => this.OnImgUploaded(img)}
              />
            : ""}
          </Page>
        </Popup>

        <Popup className="splash-select" swipeToClose opened={this.state.selectSplash} onPopupClosed={() => this.setState({selectSplash : false})}>
          <Page>
            <BlockTitle large style={{justifySelf: "center"}}>Titelbild wählen</BlockTitle>
            {(typeof this.state.project !== "number") ? 
              <MediaGallery 
                id={`title-select-gallery`}
                data={this.getImagesFor(this.$f7.data.getUser().getName())}
                sortBy={this.state.sortBy}
                enableDeletion={false}
                enableFavorization={false}
                enableDownload={false}
                style={{width: "100%", height: "100%"}}
                displayCount={this.state.displayCount}
                shouldReturnSelectedMedia={true}
                onSelectMedia={this.onSelectSplash.bind(this)}
              />
            : ""}
          </Page>
        </Popup>
      
      {(typeof this.state.project !== "number") ? 
       	<NewProjectPopup
          id = "ProjectDisplay"
          owningUser={this.$f7.data.getUser()}
          parentGroup={this.state.project.getGroup()}
          caption={"Bearbeite Projekt: " + this.state.project.getName()}
          projectToEdit={this.state.project}
        />
      : ""}

      <Popup swipeToClose opened={this.state.closeProject} onPopupClosed={() => this.setState({closeProject : false})}>
        <Page>
          <BlockTitle large style={{justifySelf: "center"}}>Urlaub mit Diashow abschließen?</BlockTitle>
          {(typeof this.state.project !== "number") ? 
            <UploadDropzone
              project={this.state.project}
              onImageUploaded={(img) => this.OnImgUploaded(img)}
            />
          : ""}
          <Button raised fillIos onClick={this.OnImgUploaded.bind(this, undefined)}>Überspringen</Button>
        </Page>
      </Popup>
    </Page>
  )
}

  onSelectSplash(img) {
    if(img !== undefined) {
      this.state.project.setSplashImgID(img.getID());
      this.state.project.store().then(val => {
        if(!val) {
          this.$f7.dialog.alert("Titelbild konnte nicht gesetzt werden!");
        }
      });
    }

    this.setState({selectSplash: false});
  }

  enqueueLatestDataCall(storeProject, count = 0) {
    if(count < 100) {
      setTimeout(() => {
        SVEData.getLatestUpload(this.$f7.data.getUser()).then(latestData => {
          if(latestData !== this.state.lastLatestID) {
            this.setState({lastLatestID: latestData});
            this.state.project.setResult(latestData);
            storeProject();
          } else {
            this.enqueueLatestDataCall(storeProject, count + 1);
          }
        }, err => this.enqueueLatestDataCall(storeProject, count + 1));
      }, (count < 50) ? 1000 : 10000);
    } else {
      storeProject();
    }
  }

  OnImgUploaded(img) {
    console.log("Media uploaded!");
    if(this.state.closeProject) {
      console.log("Close project!");

      let storeProject = () => {
        this.state.project.setState(SVEProjectState.Closed);
        this.state.project.store().then(val => {
          this.$f7.toast.create({
            text: val ? "Projekt erfolgreich abgeschlossen!" : "Projekt wurde nicht korrekt abgeschlossen!",
            closeButton: !val,
            closeButtonText: 'Ok',
            closeButtonColor: 'red',
            closeTimeout: val ? 2000 : undefined
          }).open();
        });
      };

      if (img !== undefined) {
        console.log(".. with result");
        this.enqueueLatestDataCall(storeProject);  
      } else {
        storeProject();
      }
      this.setState({closeProject: false});
    }

    this.updateUploadedImages();
  }

  getImagesFor(user) {
    return (this.state.viewableUsers.has(user)) ? this.state.viewableUsers.get(user) : []
  }

  getListFromMap(map) {
    let ret = [];
    for (let [k, v] of map) {
      ret.push({key: k, value: v});
    }
    return ret;
  }

  getReadableSortName(sB) {
    if (sB == Sorting.AgeASC)
      return "Alter aufsteigend";
    if (sB == Sorting.AgeDESC)
      return "Alter absteigend";

    if (sB == Sorting.UploadASC)
      return "Upload aufsteigend";
    if (sB == Sorting.UploadDESC)
      return "Upload absteigend";
    
    return "Unbekannt";
  }

  setSortBy(SortBy) {
    this.setState({sortBy: SortBy});

    Dom7("#SortByList").click();
    //Dom7("SortByList").mousedown();
    Dom7("#SortByAccordion").trigger('accordion:closed');
    Dom7("#sort-radio").trigger('accordion:closed');
  }

  updateUploadedImages() {
    SVEData.getLatestUpload(this.$f7.data.getUser()).then(latestData => {
        this.setState({lastLatestID: latestData});
    });

    var self = this;
    var $$ = Dom7;

    self.state.viewableUsers = new Map();

    self.state.project.getData().then((unclassified_imgs) => {
      let imgs = [];

      let finalize = () => {
        if(imgs.length === unclassified_imgs.length) {
          imgs.forEach(i => {
            i.getOwner().then(usr => {
              if (usr.getName().length <= 1) {
                console.log("Invalid user: " + JSON.stringify(usr));
                return;
              }
    
              let vu = self.state.viewableUsers;
              let list = (vu.has(usr.getName())) ? vu.get(usr.getName()) : [];
    
              list.push(i);
              vu.set(usr.getName(), list);
              self.setState({viewableUsers: vu});
            });
          });
        }
      }

      if(self.state.project.getType() !== SVEProjectType.Vacation) {
        console.log("Pulling class names for documents..");
        unclassified_imgs.forEach(i => {
          i.pullClassification().then(() => {
            imgs.push(i);
            finalize();
          }, err => { imgs.push(i); console.error(err); finalize(); });
        });
      } else {
        console.log("Skip class names for vaction pictures!");
        imgs = unclassified_imgs;
      }
      // just in case it's empty or this is a vacations project
      finalize();
    }, 
    err => console.log("Fetching data error: " + JSON.stringify(err)));

    let favImgs = {};
    // Init
    self.setState({favoriteImgs: favImgs});

    if (self.$device.ios || self.$device.android)
    {
      let lastScrollPos = 0.0;
      window.onscroll = (evt) => {
        if (document.body.scrollTop > lastScrollPos) {
          window.scrollTo(0,document.body.scrollHeight);
        }
        
        if (document.body.scrollTop < lastScrollPos) {
          window.scrollTo(0,0);
        }

        lastScrollPos = document.body.scrollTop;
      };
    }
    $$("#ImgSwiper").css("height", this.getSwiperHeight() + "px");
  }

  getSwiperHeight() {
    var $$ = Dom7;
    if($$("#ImgSwiper") !== null && $$("#ImgSwiper").offset() !== null) {
      let h = ($$("#page").height() - $$("#ImgSwiper").offset().top - 2 * $$(".navbar").height());
      if (this.$device.ios || this.$device.android)
      {
        h = window.innerHeight * 0.9;
      }
      return h;
      /*$$("#ImgSwiper").css("height", h + "px");
      document.querySelectorAll(".scrollBox").forEach((e, ke, p) => {
        e.style.height = h + "px";
      });
      $$(".scrollBox").each((i, e) => e.css("height", h + "px"));*/
    } else {
      return 500;
    }
  }

  showOnMap() {
    this.setState({showMap: true});
  }

  updateContent() {
    var self = this;
    var router = this.$f7router;

    Dom7("#ImgSwiper").css("height", this.getSwiperHeight() + "px");

    if (typeof this.state.project !== "number") {
      this.state.project.getGroup().getRightsForUser(this.$f7.data.getUser()).then(rights => {
        let panelContent = {
          caption: "Urlaubsaktionen",
          menueItems: [
            (rights.write && this.state.project.getState() === SVEProjectState.Open) ?
            {
              caption: "Medien hochladen",
              onClick: function() { self.setState({showUpload : true}) }
            } : {}, 
            (rights.write) ?
            {
              caption: "Bearbeiten",
              onClick: function() { self.$f7.data.getPopupComponent('NewProjectPopupProjectDisplay').setComponentVisible(true); }
            } : {},
            {
              caption: "Teilen",
              onClick: function() { router.navigate("/projectdetails/" + self.state.project.getID() + "/") }
            },
            {
              caption: "Mitglieder",
              onClick: function() { router.navigate("/users/" + self.state.project.getGroup().getID() + "/") }
            },
            {
              caption: "Herunterladen",
              onClick: function() { 
                window.open(SVESystemInfo.getInstance().sources.sveService + '/project/' + self.state.project.getID() + '/data/zip', "_system");
              }
            },
            (rights.admin) ?
            {
              caption: "Projekt abschließen",
              color: "green",
              onClick: function() { 
                self.setState({closeProject: true});
              }
            } : {},
            (rights.admin) ?
            {
              caption: "Titelbild wählen",
              onClick: function() { 
                self.setState({selectSplash: true});
              }
            } : {},
            (rights.admin) ?
            {
              caption: "Projekt löschen",
              color: "red",
              onClick: function() { 
                self.$f7.dialog.confirm("Möchten Sie das Projekt wirklich löschen?", "Projekt löschen", () => {
                  self.state.project.remove().then(v => {
                    if(v) {
                      router.back();
                    } else {
                      self.$f7.dialog.alert("Löschen war nicht möglich! Überprüfen Sie Ihre Rechte.");
                    }
                  });
                }, () =>  {});
              }
            } : {}
            /*,
            {
              caption: "Karte",
              onClick: function() { self.showOnMap(); }
            }*/
          ]
        };

        self.$f7.data.pushRightPanel(panelContent);
      });
    }

    if (typeof this.state.project !== "number") {
      this.state.project.getOwner().then(user => {
        self.setState({ownerName: user.getName()});
        self.updateUploadedImages();
      });
    }
  }

  componentDidMount() {
    var router = this.$f7router;
    var self = this;
    var $$ = Dom7;
    this.$f7ready((f7) => {
      self.$f7.data.addLoginHook(() => {
        self.updateContent();
      });

      if (typeof self.state.project === "number") {
        self.setState({project: new SVEProject(self.state.project, this.$f7.data.getUser(), p => {
          p.getResult().then((data => {
            if (isNaN(data.getID())) {
              console.log("Got result error on Server!");
            } else {
              self.setState({
                resultURI: data.getURI(SVEDataVersion.Full, false),
                resultPosterURI: data.getURI(SVEDataVersion.Preview, false),
                resultType: data.getContentType(SVEDataVersion.Full)
              });
            }
          }), err => {});
          self.updateContent();
        })});
      }

      $$(document).on('page:reinit', function (e) {
        self.updateContent();
      });

      //self.registerScrollListeners();
    });
  }

  onPageBeforeRemove() {
    console.log("before page remove!");
    this.$f7.data.popRightPanel();
    // Destroy popup when page removed
    if (this.popup) this.popup.destroy();
  }

  getDerivedStateFromError(error) {
    console.log("Got error: " + JSON.stringify(error));
    return { hasError: true, errorMsg: JSON.stringify(error) };
  }
}