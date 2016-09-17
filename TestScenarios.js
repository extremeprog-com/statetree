module.exports = {
    "StateTree should be functional": {
        "AsyncData Object":  {
            "Functional": [
                "unit ad/ad.functional: " +
                    "should create AsyncData object, " +
                    "should show changes when object is changed" +
                    "should load data to the object"
                , "func ad/workflow: " +
                    "create AsyncData, user subscribed, load data to AsyncData, user gets data, read data again, user gets data again"
                , "func ad/workflow_with_error: create AsyncData, user subscribed, load data to AsyncData, user gets data, load data to AsyncData with error, user gets error message and have access to old data"
                , "func ad/workflow_with_loading_error: create AsyncData, user subscribed, load data to AsyncData with error, user gets error message"
            ],
            "Reliable": [

            ]
        }
    }
};