import React, { createContext, useState, useContext } from 'react';

const AudioContext = createContext();


export const AudioProvider = ({ children }) => {
    const [ currentSound, setCurrentSound ] = useState(null);
    const [ currentUrl, setCurrentUrl ] = useState(null);

    const playNewSound = async(newSound, url) => {
        if(currentSound && currentSound !== newSound) {
            await currentSound.stopAsync();
            await currentSound.unloadAsync();
        }
        setCurrentSound(newSound);
        setCurrentUrl(url);
    }

    return(
        <AudioContext.Provider value={{ playNewSound, currentUrl }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => useContext(AudioContext);
