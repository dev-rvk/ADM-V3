import Scrcpy from "./scrcpy";
import Shell from "./shell";
import FileManager from "./file-manager";
import { observer } from "mobx-react-lite";
import { NextPage } from "next";

const DevModeView: NextPage = () => {
    return (
        <div
            style={{
                padding: "5px",
                height: "calc(100vh - 50px)", // Adjust for the height of the navigation bar
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateRows: "1fr 1.5fr", // Adjust ratio to make Shell taller and FileManager shorter
                    gridTemplateColumns: "2fr 1fr", // Two columns with FileManager/Shell taking 2/3 and Scrcpy taking 1/3
                    height: "100%", // Use the full height of the outer div
                    overflow: "auto",
                }}
            >
                <div
                    style={{
                        gridRow: "1 / 2", // First row
                        gridColumn: "1 / 2", // First column
                        overflow: "auto",
                    }}
                >
                    <FileManager />
                </div>
                <div
                    style={{
                        gridRow: "2 / 3", // Second row
                        gridColumn: "1 / 2", // First column
                        overflow: "auto",
                    }}
                >
                    <Shell />
                </div>
                <div
                    style={{
                        gridRow: "1 / 3", // Span both rows
                        gridColumn: "2 / 3", // Second column
                        overflow: "auto",
                        height: "calc(100% + 15px)", // Increase height by 5px
                        // backgroundColor: "black",
                        // display: "flex",
                        // flexDirection: "column", // Allow Scrcpy to expand vertically
                    }}
                >
                    <Scrcpy />
                </div>
            </div>
        </div>
    );
};

export default observer(DevModeView);
