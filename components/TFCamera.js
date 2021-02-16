import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Camera } from "expo-camera";
import { cameraWithTensors, bundleResourceIO } from "@tensorflow/tfjs-react-native";
import * as tf from "@tensorflow/tfjs";
// import * as handpose from '@tensorflow-models/handpose';
//import * as mobilenet from "@tensorflow-models/mobilenet";
import Constants from "expo-constants";
import * as Permissions from "expo-permissions";

const TensorCamera = cameraWithTensors(Camera);

const styles = StyleSheet.create({
  camera: {
    height: 320,
    width: 240,
  },
});

async function getPermissionAsync() {
  if (Constants.platform.ios) {
    const { status } = await Permissions.askAsync(Permissions.CAMERA_ROLL);
    if (status !== "granted") {
      alert("Permission for camera access required.");
    }
  }
}


class TFCamera extends React.Component {
  _isMounted = false;
  constructor(prop) {
    super(prop);
    this.name = "tf-adam";
    this.state = {
      isModelReady: false,
      useModel: {},
      //model: null,
    };
  }

  init() {}

  async componentDidMount() {
    await tf.ready();
    // Signal to the app that tensorflow.js can now be used.
    console.log("componentDidMount: tf.ready is set");
    console.log("the MyModelLoadLocal component is mounted");
    const { status } = await Camera.requestPermissionsAsync();
    // this.setState({cameraPermission: status === 'granted'});
    console.log("start loading model");
    // const model = await handpose.load();
    ///const model = await mobilenet.load();
    const mmodel = require("../assets/model/7model.json");
    const weights = require("../assets/model/7weights.bin");
    //loadLayersModel
    //loadGraphModel
    const loadedModel = await tf.loadLayersModel(
      bundleResourceIO(mmodel, weights)
    );

    this.setState({ isModelReady: true, loadedModel });
    console.log("model loaded");
  }

  makeHandleCameraStream() {
    return (images, updatePreview, gl) => {
      const loop = async () => {
          const nextImageTensor = images.next().value;
          // const predictions = await this.state.model.estimateHands(nextImageTensor);
          //nextImageTensor.expandDims(0);
          //const predictions = await this.state.loadedModel.predict(nextImageTensor.reshape([1, 224, 224, 3]));
          const predictions = await this.state.loadedModel.predict(nextImageTensor);
          this.setState({predictions})
          //setPredictions(predictions);
          requestAnimationFrame(loop);
      };
      loop();
    };
  }

  


  render() {
    let textureDims;
    if (Platform.OS === "ios") {
      textureDims = {
        height: 1920,
        width: 1080,
      };
    } else {
      textureDims = {
        height: 1200,
        width: 1600,
      };
    }

    return (
      <View>
        {this.state.loadedModel && (
          <TensorCamera
            // Standard Camera props
            style={styles.camera}
            type={Camera.Constants.Type.front}
            // Tensor related props
            cameraTextureHeight={textureDims.height}
            cameraTextureWidth={textureDims.width}
            
            resizeHeight={224}
            resizeWidth={224}
            resizeDepth={3}
            onReady={this.makeHandleCameraStream()}
            autorender={true}
          />
        )}

        {this.state.predictions && 
            <View>
            <Text>{JSON.stringify(this.state.predictions, 0, 4)}</Text>
            </View>
        }

      </View>
    );
  }
}

export default TFCamera;
