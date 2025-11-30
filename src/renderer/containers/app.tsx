import React, { CSSProperties, FC, useEffect, useState } from 'react';
import { CONFIG } from '../api';
import * as ConfigActions from '../actions/config';
import imageSrc from './sqlectron.gif';

import '../../../vendor/renderer/semantic-ui/semantic';
import { sqlectron } from '../api';
import * as eventKeys from '../../common/event';
import { mapObjectToConfig } from '../utils/config';
import MenuHandler from '../utils/menu';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { cloneDeep } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('../../../vendor/renderer/lato/latofonts.css');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('../../../vendor/renderer/semantic-ui/semantic.css');
// eslint-disable-next-line @typescript-eslint/no-require-imports
require('./app.css');

const AppContainer: FC = ({ children }) => {
  const dispatch = useAppDispatch();
  const config = useAppSelector((state) => state.config);

  const [menuHandler] = useState(new MenuHandler());

  useEffect(() => {
    dispatch(ConfigActions.loadConfig());
  }, [dispatch]);

  useEffect(() => {
    const updateConfig = async (data) => {
      await dispatch(ConfigActions.saveConfig(mapObjectToConfig(data)));
      dispatch(ConfigActions.finishEditing());
    };

    menuHandler.setMenus({
      [eventKeys.BROWSER_MENU_ZOOM_IN]: () => {
        if (!config.data) {
          return;
        }
        const data = cloneDeep(config.data);
        data.zoomFactor = (data.zoomFactor || 1) + 0.2;
        updateConfig(data);
      },
      [eventKeys.BROWSER_MENU_ZOOM_OUT]: () => {
        if (!config.data) {
          return;
        }
        const data = cloneDeep(config.data);
        data.zoomFactor = (data.zoomFactor || 1) - 0.2;
        updateConfig(data);
      },
      [eventKeys.BROWSER_MENU_ZOOM_RESET]: () => {
        if (!config.data) {
          return;
        }
        const data = cloneDeep(config.data);
        data.zoomFactor = 1;
        updateConfig(data);
      },
    });
  }, [dispatch, config, menuHandler]);

  useEffect(() => {
    return () => {
      menuHandler.dispose();
    };
  }, [menuHandler]);

  useEffect(() => {
    if (!config.data) {
      return;
    }
    const { zoomFactor, enabledDarkTheme, disabledOpenAnimation } = config.data;
    if (typeof zoomFactor !== 'undefined' && zoomFactor > 0) {
      // Apply the zoom factor
      // Required for HiDPI support
      sqlectron.browser.webFrame.setZoomFactor(zoomFactor);
    }
    if (enabledDarkTheme === true) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }

    // remove the loading screen quickly if disabled
    const l1 = document.getElementById('loading');
    const l2 = document.getElementById('loading-signal');
    const l3 = document.getElementById('loading-started');
    if (l1 && l2 && l3 && disabledOpenAnimation) {
      l1.remove();
      l2.remove();
    }
    if (l1 && l2 && l3 && !disabledOpenAnimation) {
      document.getElementById('loading-started')?.remove();

      const img = new Image();
      img.onload = () => {
        setTimeout(() => {
          const loadingWrapper = document.getElementById('loading');
          const loadingInner = document.createElement('div');

          const version = document.createElement('H3');
          version.appendChild(document.createTextNode(`v${CONFIG.version}`));

          loadingInner.appendChild(version);
          loadingInner.appendChild(img);

          if (!loadingWrapper) {
            return;
          }

          loadingWrapper.appendChild(loadingInner);
          loadingInner.style.display = 'block';

          setTimeout(() => {
            loadingWrapper.className = 'loading-hidden';
            setTimeout(() => {
              loadingWrapper.remove();
            }, 500);
          }, 4500);
          document.getElementById('loading-signal')?.remove();
        }, 500);
      };
      img.src = imageSrc;
    }
  }, [config]);

  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();

    // Prevent drag and drop causing redirect
    document.addEventListener('dragover', preventDefault, false);
    document.addEventListener('drop', preventDefault, false);

    return () => {
      document.removeEventListener('dragover', preventDefault, false);
      document.removeEventListener('drop', preventDefault, false);
    };
  }, []);

  let style: CSSProperties | undefined = undefined;

  if (config.isLoaded) {
    const customFont = config.data?.customFont || 'Lato';
    style = { fontFamily: `'${customFont}', 'Helvetica Neue', Arial, Helvetica, sans-serif` };
  }

  return (
    <div className="ui" style={style}>
      {config.isLoaded ? children : null}
    </div>
  );
};

AppContainer.displayName = 'AppContainer';
export default AppContainer;
