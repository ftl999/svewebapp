import React, { useState, useEffect } from 'react';
import { SwipeoutActions, SwipeoutButton, Page, Navbar, List, ListInput, ListItem, NavRight, Link, Popover, Button, Block, BlockHeader, Popup, Row, Icon } from 'framework7-react';
import NewGroupPopup from './NewGroupPopup';
import NewProjectPopup from './NewProjectPopup';
import QRCodeScanner from './QRCodeScanner';
import Dom7 from 'dom7';

//import { Camera } from 'expo-camera';
import {SVEGroup} from 'svebaselib';

export default class extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      group: Number(props.f7route.params.id),
      projects: [],
      projectToEdit: undefined,
      selectedProject: undefined, //desktop version only
    };
  }
  render() {
    return (
      <Page name="context" onPageBeforeRemove={this.onPageBeforeRemove.bind(this)}>
        <Navbar title="Urlaube" backLink="Back">
          <NavRight>
            <Link iconIos="f7:menu" iconAurora="f7:menu" iconMd="material:menu" panelOpen="right" />
          </NavRight>
        </Navbar>
        <List noChevron={this.$f7.device.desktop}>
          {this.state.projects.map((project) => (
            <ListItem
              swipeout
              key={project.getID()}
              title={project.getName()}
              link={`/project/${project.getID()}/`}
              onSwipeoutDeleted={this.onRemoveProject.bind(this, project)}
            >
              <img slot="media" src={project.getSplashImageURI()} width="80"/>
              <SwipeoutActions right={!this.$f7.device.desktop} style={(!this.$f7.device.desktop) ? {} : {display: "none"}}>
                <SwipeoutButton onClick={this.onShowEdit.bind(this, project)}>Bearbeiten</SwipeoutButton>
                <SwipeoutButton delete confirmText={`Möchten Sie das Projekt ${project.getName()} wirklich löschen?`}>Löschen</SwipeoutButton>
              </SwipeoutActions>
              <Link slot="after" href="#" style={(this.$f7.device.desktop) ? {} : {display: "none"}} popoverOpen=".popover-more" onClick={this.desktopOpenDetails.bind(this, project)}>
                <Icon f7="arrowtriangle_down_square" tooltip="Bearbeiten"></Icon>
              </Link>
            </ListItem>
          ))}
        </List>

        <Popover className="popover-more">
          <List noChevron>
            <ListItem link="#" popoverClose={true} title="Bearbeiten" onClick={this.onShowEdit.bind(this, this.state.selectedProject)}/>
            <ListItem link="#" popoverClose={true} title="Löschen" style={{color: "#FF1111"}} onClick={this.onRemoveProject.bind(this, this.state.selectedProject, true)}/>
          </List>
        </Popover>

        <NewGroupPopup
          owningUser={this.$f7.data.getUser()}
          onGroupCreated={this.onGroupCreated.bind(this)}
        />

        <QRCodeScanner
          onDecoded={(link) => {
            this.$f7.data.joinGroup(link);
            this.$f7.data.getPopupComponent(QRCodeScanner.constructor.name).setComponentVisible(false);
          }}
        />

        {(typeof this.state.group !== "number") ? 
          <NewProjectPopup
            owningUser={this.$f7.data.getUser()}
            onProjectCreated={(prj) => this.state.group.getProjects().then(prjs => { this.$f7.data.getPopupComponent(NewProjectPopup.constructor.name).setComponentVisible(false); this.setState({projectToEdit: undefined, projects: prjs}); })}
            parentGroup={this.state.group}
            caption={(this.state.selectedProject === undefined) ? "Neuer Urlaub" : "Bearbeite Projekt: " + this.state.selectedProject.getName()}
            projectToEdit={this.state.selectedProject}
          />
        : ""}
      </Page>
    );
  }

  applyProjectEdit() {
    var self = this;

    this.state.projectToEdit.store().then((success) => {
      if(success) {
        self.updateContent();
      } else {
        self.$f7.dialog.alert("Fehlende Berechtigung zum bearbeiten!", "Fehlende Berechtigung");
      }
    });
    
    this.setState({ projectToEdit: undefined});
  }

  onShowEdit(prj) {
    this.setState({ projectToEdit: prj});
    this.$f7.data.getPopupComponent(NewProjectPopup.constructor.name).setComponentVisible(true);
  }

  desktopOpenDetails(prj) {
    this.setState({selectedProject: prj});
  }

  onRemoveProject(project, shouldPromt = false) {
    if (shouldPromt) {
      var self = this;
      this.$f7.dialog.confirm(`Möchten Sie das Projekt ${project.getName()} wirklich löschen?`, "Löschen?", () => { self.onRemoveProject(project); });
    }
    else {
      var dialog = this.$f7.dialog;
      project.remove().then((sucess) => {
        if(!sucess) {
          dialog.alert("Urlaub konnte nicht gelöscht werden!");
        }
      });
    }
  }

  onGroupCreated(group) {
    this.$f7.data.getPopupComponent(NewGroupPopup.constructor.name).setComponentVisible(false);
  }

  openCamera() {
    this.$f7.data.resetCameraPermissions();
    this.$f7.data.getPopupComponent(QRCodeScanner.constructor.name).setComponentVisible(true);
    console.log("Open Camera");
  }

  onGroupReady(group) {
    if (isNaN(group.getID())) // safety first!
      return;

    var router = this.$f7router;
    var f7 = this.$f7;
    var self = this;
    if (typeof this.state.group !== "number") {
      this.state.group.getRightsForUser(this.$f7.data.getUser()).then(rights => {
        let panelContent = {
            caption: "Gruppenoptionen",
            menueItems: [
              {
                caption: "Neuer Urlaub",
                onClick: function() { self.$f7.data.getPopupComponent(NewProjectPopup.constructor.name).setComponentVisible(true); }
              },
              {
                caption: "Einladen",
                onClick: function() { router.navigate("/contextdetails/" + group.getID() + "/") }
              },
              {
                caption: "Neue Gruppe",
                onClick: function() { self.$f7.data.getPopupComponent(NewGroupPopup.constructor.name).setComponentVisible(true); }
              },
              {
                caption: "Mitglieder",
                onClick: function() { router.navigate("/users/" + group.getID() + "/") }
              },
              {
                caption: "Beitreten",
                onClick: function() { self.openCamera() }
              }
            ]
        };
        if (rights.admin)
        {
          panelContent.menueItems.push({
            caption: "Gruppe löschen",
            color: "red",
            onClick: function() { 
              self.$f7.dialog.confirm("Möchten Sie das Projekt wirklich löschen?", "Projekt löschen", () => {
                self.state.group.remove().then(v => {
                  if(v) {
                    router.back();
                  } else {
                    self.$f7.dialog.alert("Löschen war nicht möglich! Überprüfen Sie Ihre Rechte.");
                  }
                });
              }, () =>  {});
            }
          });
        }
        self.$f7.data.pushRightPanel(panelContent);
      });
    }

    self.setState({projects: []});
    group.getProjects().then(prjs => {
      self.setState({projects: prjs});
    });
  }

  componentDidMount() {
    var self = this;
    this.$f7ready((f7) => {
      if (typeof self.state.group === "number") {
        self.setState({group: new SVEGroup({id: self.state.group}, this.$f7.data.getUser(), g => self.onGroupReady(g))});
      }
      Dom7(document).on('page:reinit', function (e) {
        if (typeof self.state.group !== "number")
          self.onGroupReady(self.state.group);
      });
    });
  }

  onPageBeforeRemove() {
    console.log("before page remove!");
    this.$f7.data.popRightPanel();
    // Destroy popup when page removed
    if (this.popup) this.popup.destroy();
  }
}