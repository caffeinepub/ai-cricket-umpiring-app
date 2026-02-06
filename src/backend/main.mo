import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import Map "mo:core/Map";
import List "mo:core/List";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";

actor {
  include MixinStorage();

  type VideoAnalysisResult = {
    lbwDecision : Verdict;
    noBallDecision : Verdict;
    edgeDetection : Verdict;
    trajectoryOverlay : Blob;
    snickoOverlay : Blob;
    frameData : [TrajectoryFrame];
  };

  type Verdict = {
    text : Text;
    confidence : Float;
    reasoning : Text;
  };

  type TrajectoryFrame = {
    ballPosition : (Float, Float);
  };

  type VideoUpload = {
    id : Text;
    videoBlob : Storage.ExternalBlob;
    analysisResult : ?VideoAnalysisResult;
    processingStatus : ProcessingStatus;
    cameraMode : CameraModeData;
  };

  type ProcessingStatus = {
    #uploading : { progress : Nat };
    #processing;
    #completed : { result : VideoAnalysisResult };
    #failed : { error : Text };
  };

  type CameraModeData = {
    activeMode : CameraModeType;
    standardSettings : StandardSettings;
    wideSettings : WideSettings;
    fieldOfView : Nat;
  };

  type CameraModeType = {
    #standard;
    #wide;
  };

  type StandardSettings = {
    resolution : (Nat, Nat);
    frameRate : Nat;
    aspectRatio : (Nat, Nat);
    stabilization : Bool;
  };

  type WideSettings = {
    resolution : (Nat, Nat);
    frameRate : Nat;
    aspectRatio : (Nat, Nat);
    stabilization : Bool;
    lensCorrection : Bool;
    wideAngleMultiplier : Float;
  };

  let videoUploads = Map.empty<Text, VideoUpload>();
  let cameraModeDefaults : CameraModeData = {
    activeMode = #standard;
    standardSettings = {
      resolution = (1920, 1080);
      frameRate = 30;
      aspectRatio = (16, 9);
      stabilization = true;
    };
    wideSettings = {
      resolution = (2560, 1080);
      frameRate = 24;
      aspectRatio = (134, 56);
      stabilization = true;
      lensCorrection = true;
      wideAngleMultiplier = 1.5;
    };
    fieldOfView = 75;
  };

  public shared ({ caller }) func uploadVideo(id : Text, videoBlob : Storage.ExternalBlob) : async Text {
    if (videoUploads.containsKey(id)) {
      Runtime.trap("Video with this ID already exists.");
    };

    let newUpload : VideoUpload = {
      id;
      videoBlob;
      analysisResult = null;
      processingStatus = #uploading { progress = 0 };
      cameraMode = cameraModeDefaults;
    };

    videoUploads.add(id, newUpload);
    "Video uploaded successfully with ID: " # id;
  };

  public query ({ caller }) func getVideoStatus(videoId : Text) : async ?ProcessingStatus {
    switch (videoUploads.get(videoId)) {
      case (null) { null };
      case (?upload) { ?upload.processingStatus };
    };
  };

  public query ({ caller }) func getAnalysisResult(videoId : Text) : async ?VideoAnalysisResult {
    switch (videoUploads.get(videoId)) {
      case (null) { null };
      case (?upload) { upload.analysisResult };
    };
  };

  public query ({ caller }) func getCameraMode(videoId : Text) : async ?CameraModeData {
    switch (videoUploads.get(videoId)) {
      case (null) { null };
      case (?upload) { ?upload.cameraMode };
    };
  };

  public shared ({ caller }) func storeAnalysisResult(videoId : Text, result : VideoAnalysisResult) : async Text {
    switch (videoUploads.get(videoId)) {
      case (null) { Runtime.trap("Video not found.") };
      case (?upload) {
        let updatedUpload : VideoUpload = {
          id = upload.id;
          videoBlob = upload.videoBlob;
          analysisResult = ?result;
          processingStatus = #completed { result };
          cameraMode = upload.cameraMode;
        };
        videoUploads.add(videoId, updatedUpload);
        "Analysis result stored successfully.";
      };
    };
  };

  public shared ({ caller }) func updateCameraMode(videoId : Text, newMode : CameraModeData) : async Text {
    switch (videoUploads.get(videoId)) {
      case (null) { Runtime.trap("Video not found.") };
      case (?upload) {
        let updatedUpload : VideoUpload = {
          id = upload.id;
          videoBlob = upload.videoBlob;
          analysisResult = upload.analysisResult;
          processingStatus = upload.processingStatus;
          cameraMode = newMode;
        };
        videoUploads.add(videoId, updatedUpload);
        "Camera mode updated successfully.";
      };
    };
  };

  public shared ({ caller }) func deleteVideo(videoId : Text) : async Text {
    switch (videoUploads.get(videoId)) {
      case (null) { Runtime.trap("Video not found.") };
      case (?_) {
        videoUploads.remove(videoId);
        "Video deleted successfully.";
      };
    };
  };

  public query ({ caller }) func getAllVideos() : async [VideoUpload] {
    let videosList = List.empty<VideoUpload>();
    for ((_, data) in videoUploads.entries()) {
      videosList.add(data);
    };
    videosList.toArray();
  };

  public query ({ caller }) func filterVideosByMode(mode : CameraModeType) : async [VideoUpload] {
    let filteredList = List.empty<VideoUpload>();
    for ((_, data) in videoUploads.entries()) {
      if (areCameraModesEqual(data.cameraMode.activeMode, mode)) {
        filteredList.add(data);
      };
    };
    filteredList.toArray();
  };

  // Helper function to compare CameraModeTypes
  func areCameraModesEqual(mode1 : CameraModeType, mode2 : CameraModeType) : Bool {
    switch (mode1, mode2) {
      case (#standard, #standard) { true };
      case (#wide, #wide) { true };
      case (_, _) { false };
    };
  };
};
