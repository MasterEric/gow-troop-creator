import React, { memo } from "react";
import { AppBar, Toolbar, Typography, useMediaQuery } from "@material-ui/core";
import { makeStyles, useTheme } from "@material-ui/core/styles";

import { Image } from "../Util";

const useStyles = makeStyles(theme => {
  return {
    appbar: {
      elevation: 0,
      position: "fixed"
    },
    toolbar: {
      paddingLeft: "8px",
      paddingRight: "8px"
    },
    appbarText: {
      alignSelf: "center",
      marginRight: "10px"
    },
    input: {
      marginLeft: "auto"
    },
    image: {
      width: "auto",
      height: "36px",
      marginRight: theme.spacing(1),
      borderRadius: theme.spacing(3),
      overflow: "hidden"
    }
  };
});

const NavBar = memo(() => {
  const classes = useStyles();
  const theme = useTheme();

  const mediaQueryLg = useMediaQuery(theme.breakpoints.up("md"));

  return (
    <AppBar color="primary" className={classes.appbar}>
      <Toolbar className={classes.toolbar}>
        <Image base="./logo36" className={classes.image} />
        <Typography className={classes.appbarText} variant="h4" color="inherit">
          {mediaQueryLg ? "Gems of War Troop Creator" : "Troop Creator"}
        </Typography>
      </Toolbar>
    </AppBar>
  );
});

export default NavBar;
