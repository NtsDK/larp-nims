import React, { Component } from 'react';
import vis from 'vis';
import 'vis/dist/vis.min.css';
import PermissionInformer from 'permissionInformer';
import ReactDOM from 'react-dom';
import { UI, U, L10n } from 'nims-app-core';
import * as R from 'ramda';
import * as CU from 'nims-dbms-core/commonUtils';
import * as Constants from 'nims-dbms/nimsConstants';
import './SocialNetworkArea.css';

export class SocialNetworkArea extends Component {
  nodesDataset = new vis.DataSet();

  edgesDataset = new vis.DataSet();

  constructor(props) {
    super(props);
    this.state = {
    };
    this.networkContainer = React.createRef();
  }

  componentDidMount() {
    this.initNetwork();
    console.log('SocialNetworkArea mounted');
  }

  componentDidUpdate() {
    console.log('SocialNetworkArea did update');
  }

  componentWillUnmount() {
    console.log('SocialNetworkArea will unmount');
  }

  initNetwork() {
    if (this.network === undefined) {
      // const timeline = new vis.Timeline(this.networkContainer.current, null, options);
      // timeline.setGroups(this.tagDataset);
      // timeline.setItems(this.timelineDataset);
      // this.timeline = timeline;
      const data = {
        nodes: this.nodesDataset,
        edges: this.edgesDataset
      }; // Note: data is coming from ./datasources/WorldCup2014.js
      const opts = R.clone(Constants.socialNetworkOpts);
      // opts.groups = groupColors;

      this.network = new vis.Network(this.networkContainer.current, data, opts);
    }
  }

  // redrawAll(groupColors, nodes, edges) {
  //   this.nodesDataset = new vis.DataSet(nodes);
  //   this.edgesDataset = new vis.DataSet(edges);
  //   const container = U.queryEl('#socialNetworkContainer');

  //   if (this.network) {
  //     this.network.destroy();
  //   }

  //   this.network.on('click', this.neighbourhoodHighlight);
  // }

  render() {
    if (this.network !== undefined) {
      // const { something } = this.state;
    }
    // const { t } = this.props;

    // if (!something) {
    //   return <div> SocialNetworkArea stub </div>;
    //   // return null;
    // }
    return (
      <div
        ref={this.networkContainer}
        className="SocialNetworkArea visualObjectContainer full-screen-elem"
        id="socialNetworkContainer"
      />
    );
  }
}
