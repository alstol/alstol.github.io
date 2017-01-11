// ==UserScript==
// @name            TWKappa
// @description     Kappa
// @author          xShteff
// @version         0.12
// @match           https://*.the-west.net/game.php*
// @match           https://*.the-west.de/game.php*
// @match           https://*.the-west.pl/game.php*
// @match           https://*.the-west.nl/game.php*
// @match           https://*.the-west.se/game.php*
// @match           https://*.the-west.ro/game.php*
// @match           https://*.the-west.com.pt/game.php*
// @match           https://*.the-west.cz/game.php*
// @match           https://*.the-west.es/game.php*
// @match           https://*.the-west.ru/game.php*
// @match           https://*.the-west.com.br/game.php*
// @match           https://*.the-west.org/game.php*
// @match           https://*.the-west.hu/game.php*
// @match           https://*.the-west.gr/game.php*
// @match           https://*.the-west.dk/game.php*
// @match           https://*.the-west.sk/game.php*
// @match           https://*.the-west.fr/game.php*
// @match           https://*.the-west.it/game.php*
// @downloadURL     https://xshteff.github.io/userscripts/kappa.user.js
// @updateURL       https://xshteff.github.io/userscripts/kappa.user.js
// @grant           none
// @run-at          document-end
// ==/UserScript==
var TWKappa = {
    Settings: {
        image_size: 200,
        video_width: 300,
        video_height: 190
    },
    VersionControl: {
        version: 0.11,
        isOutdated: function() {
            return TWKappa.Emotes.Extra.storage.latestVersion > TWKappa.VersionControl.version;
        },
        notifyOutdated: function() {
            if (TWKappa.VersionControl.isOutdated()) {
                new west.gui.Dialog('TWKappa is outdated', 'There\'s a new version of TWKappa currently available! Do you want to install it?', west.gui.Dialog.SYS_WARNING).addButton("Install!", function() {
                    window.open('https://xshteff.github.io/userscripts/kappa.user.js', '_blank');
                }).addButton("Close", function() {}).show();
            }
        }
    },
    LocalStorage: {
        key: 'twkappa_settings',
        init: function() {
            if (localStorage.getItem(TWKappa.LocalStorage.key) === null)
                TWKappa.LocalStorage.save();
            else {
                var fromLocal = JSON.parse(localStorage.getItem(TWKappa.LocalStorage.key));
                for (var key in TWKappa.Settings) {
                    if (fromLocal[key] === undefined) {
                        TWKappa.LocalStorage.save();
                        break;
                    }
                }
                TWKappa.LocalStorage.load();
            }
        },
        save: function() {
            localStorage.setItem(TWKappa.LocalStorage.key, JSON.stringify(TWKappa.Settings));
        },
        load: function() {
            TWKappa.Settings = JSON.parse(localStorage.getItem(TWKappa.LocalStorage.key));
        }
    },
    Window: {
        RegisterWestApi: function() {
            var content = $('<div>').text("TWKappa, developed by xShteff. Feedback or ideas must be posted on the international forum");
            TheWestApi.register('TWKappa', 'TW Twitch Chat Emotes', '2.1', Game.version.toString(), 'xShteff', 'https://xshteff.github.io').setGui(content);
        },
        Table: {
            buildRow: function(array) {
                var row = $('<tr>');
                for (var i = 0; i < array.length; i++)
                    row.append(array[i]);
                return row;
            },
            buildCell: function(content) {
                return $('<td>').html(content);
            },
            buildRowCell: function(content) {
                return $('<td>').attr('colspan', '2').html(content);
            },
            buildLabel: function(text) {
                return $('<td>').text(text).css({
                    'line-height': '30px',
                    'font-weight': 'bold'
                });
            },
            buildInputTable: function() {
                var table = $('<table>').attr('id', 'twkappa_input_table');
                var r1Content = [TWKappa.Window.Table.buildLabel("Img max size: "), TWKappa.Window.Table.buildCell(new west.gui.Textfield('kappa_image_size').setValue(TWKappa.Settings.image_size).setSize(2).onlyNumeric().getMainDiv())];
                var r1 = TWKappa.Window.Table.buildRow(r1Content);

                var rYTWidthContent = [TWKappa.Window.Table.buildLabel("YT Height: "), TWKappa.Window.Table.buildCell(new west.gui.Textfield('kappa_yt_height').setValue(TWKappa.Settings.video_height).setSize(2).onlyNumeric().getMainDiv())];
                var rYTWidth = TWKappa.Window.Table.buildRow(rYTWidthContent);
                var rYTHeightContent = [TWKappa.Window.Table.buildLabel("YT Width: "), TWKappa.Window.Table.buildCell(new west.gui.Textfield('kappa_yt_width').setValue(TWKappa.Settings.video_width).setSize(2).onlyNumeric().getMainDiv())];
                var rYTHeight = TWKappa.Window.Table.buildRow(rYTHeightContent);
                var buttonSave = new west.gui.Button("Save Size", function() {
                    var size = $('#kappa_image_size').val();
                    TWKappa.Settings.image_size = size;
                    TWKappa.Settings.video_height = $('#kappa_yt_height').val();
                    TWKappa.Settings.video_width = $('#kappa_yt_width').val();

                    new UserMessage("Settings saved!").show();
                    TWKappa.LocalStorage.save();
                });

                var buttonEmotes = new west.gui.Button("Toggle emotes", function() {
                    $('#tw_kappa_emote_list').toggle();
                });

                var buttonFetchEmotes = new west.gui.Button("Refresh emotes", function() {
                    TWKappa.Emotes.Twitch.init();
                    TWKappa.Emotes.Extra.init();
                });
                var r2 = TWKappa.Window.Table.buildRow([TWKappa.Window.Table.buildCell(buttonFetchEmotes.getMainDiv()), TWKappa.Window.Table.buildCell(buttonEmotes.getMainDiv())]);
                table.append(r1).append(rYTHeight).append(rYTWidth).append(TWKappa.Window.Table.buildRow(TWKappa.Window.Table.buildRowCell("<i>Setting any of these to 0 will disable the feature</i>"))).append(TWKappa.Window.Table.buildRow(TWKappa.Window.Table.buildCell(buttonSave.getMainDiv()))).append(r2);
                return table;
            },
            buildEmoteTable: function() {
                var table = $('<table>').attr({
                    'id': 'tw_kappa_emote_list',
                    'border': 1
                }).css({
                    'display': 'none',
                    'text-align': 'center',
                    'width': '100%'
                });
                var header = $('<tr>');
                header.append(TWKappa.Window.Table.buildCell("<b>Image</b>"), TWKappa.Window.Table.buildCell("<b>Keyword</b>"))
                table.append(header);
                $.each(TWKappa.Emotes.Extra.storage.emotes, function(key, value) {
                    var row = $('<tr>');
                    var image = $('<img>').attr({
                        'src': value,
                        'alt': key,
                        'title': key,
                        'class': 'twkappa_preview'
                    }).click(function() {
                        var val = $('input.message').val();
                        $('input.message').val(val + key + " ")
                    });
                    row.append(TWKappa.Window.Table.buildCell(image), TWKappa.Window.Table.buildCell(key));
                    table.append(row);
                });
                $.each(TWKappa.Emotes.Twitch.storage.emotes, function(key, value) {
                    var row = $('<tr>');
                    var image = $('<img>').attr({
                        'src': "https://static-cdn.jtvnw.net/emoticons/v1/" + value.image_id + "/1.0",
                        'alt': key,
                        'title': key,
                        'class': 'twkappa_preview'
                    }).click(function() {
                        var val = $('input.message').val();
                        $('input.message').val(val + key + " ")
                    });
                    row.append(TWKappa.Window.Table.buildCell(image), TWKappa.Window.Table.buildCell(key));
                    table.append(row);
                });
                return table;
            }
        },
        open: function() {
            var content = $('<div>');
            content.append(TWKappa.Window.Table.buildInputTable());
            content.append(TWKappa.Window.Table.buildEmoteTable());
            var contentScroll = new west.gui.Scrollpane().appendContent(content);
            wman.open("twkappa", "TWKappa").setMiniTitle("TWKappa").setSize(320, 480).appendToContentPane(contentScroll.getMainDiv());
            $('#twkappa_input_table tr:nth-child(4) td').css('padding-bottom', '20px');
        },
    },
    Icon: {
        init: function() {
            var icon = $('<div></div>').attr({
                'title': 'TWKappa',
                'class': 'menulink'
            }).css({
                'background': 'url("http://puu.sh/rQG5v/fee8e31d02.png")',
                'background-position': '0px 0px'
            }).mouseleave(function() {
                $(this).css("background-position", "0px 0px");
            }).mouseenter(function(e) {
                $(this).css("background-position", "25px 0px");
            }).click(function() {
                TWKappa.Window.open();
            });

            var cap = $('<div></div>').attr({
                'class': 'menucontainer_bottom'
            });

            if ($('#twkappa_init_button').length == 0)
                $("#ui_menubar").append($('<div></div>').attr({
                    'class': 'ui_menucontainer',
                    'id': 'twkappa_init_button'
                }).append(icon).append(cap));
        }
    },
    Emotes: {
        Extra: {
            storage: null,
            init: function() {
                $.get("https://xshteff.github.io/userscripts/emotes.json", function(data) {
                    TWKappa.Emotes.Extra.storage = data;
                    TWKappa.VersionControl.notifyOutdated();
                    new UserMessage('Extra Emotes Loaded').show();
                    TWKappa.VersionControl.notifyOutdated();
                }).fail(function() {
                    new UserMessage('Can\'t load Extra emotes').show();
                });
            }
        },
        Twitch: {
            storage: null,
            init: function() {
                $.get("https://twitchemotes.com/api_cache/v2/global.json", function(data) {
                    TWKappa.Emotes.Twitch.storage = data;
                    new UserMessage('Twitch Emotes Loaded').show();
                }).fail(function() {
                    new UserMessage('Can\'t load Twitch emotes').show();
                });
            }
        },
        isInit: function() {
            return TWKappa.Emotes.Twitch.storage !== null || TWKappa.Emotes.Extra.storage !== null;
        },
        Fix: {
            "KappaPride": "55338",
            "KappaClaus": "74510",
            "KappaWealth": "81997",
            "KappaRoss": "70433",
            "PeteZarollTie": "81244",
            'AMPEnergyCherry': '99265'
        }
    },
    GameInject: {
        parser: function() {
            var oldfunc = Game.TextHandler.parse;
            Game.TextHandler.parse = function(m) {
                //YouTube
                if (TWKappa.Settings.video_width > 0 && TWKappa.Settings.video_height > 0) {
                    var ytRegex = /^(?:https?:\/\/)?(?:www\.)?youtu(?:be\.com\/watch\?(?:.*?&(?:amp;)?)?v=|\.be\/)([\w\-]+)(?:&(?:amp;)?[\w\?=]*)?$/g;
                    var isYT = ytRegex.test(m);
                    if (isYT) {
                        var ytUrl = ytRegex.exec(m);
                        var ytFrame = $('<iframe>').attr({
                            width: TWKappa.Settings.video_width,
                            height: TWKappa.Settings.video_height,
                            src: `https://www.youtube.com/embed/${ytRegex.exec(m)[1]}`,
                            frameborder: 0,
                            allowfullscreeen: ''
                        });
                        return ytFrame[0].outerHTML;
                    }
                }

                //Images
                if (TWKappa.Settings.image_size > 0) {
                    var imgRegex = /^http(|s):\/\/([^\s]*)\.(png|jpg|gif)$/g;
                    if (imgRegex.test(m)) {
                        var image = $('<img>').attr({
                            src: m,
                            alt: "Click to enlarge"
                        }).css({
                            'max-width': TWKappa.Settings.image_size + 'px',
                            'max-height': TWKappa.Settings.image_size + 'px'
                        });
                        return oldfunc("<a href='" + m + "' target='_blank'>" + image[0].outerHTML + "</a>");
                    }
                }

                //Extra Emotes
                for (var k in TWKappa.Emotes.Extra.storage.emotes)
                    m = m.replace(new RegExp("(^|\\s)" + k.replace(/([\)\.\^\(])/g, "\\$1"), "g"), " <img alt='" + k + "' title='" + k + "' src='" + TWKappa.Emotes.Extra.storage.emotes[k] + "' />");

                //Fix for Kappas
                for (var k in TWKappa.Emotes.Fix)
                    m = m.replace(new RegExp("(^|\\s)" + k.replace(/([\)\.\^\(])/g, "\\$1"), "g"), " <img alt='" + k + "' title='" + k + "' src='https://static-cdn.jtvnw.net/emoticons/v1/" + TWKappa.Emotes.Fix[k] + "/1.0' />");

                //Twitch Emotes
                for (var k in TWKappa.Emotes.Twitch.storage.emotes)
                    m = m.replace(new RegExp("(^|\\s)" + k.replace(/([\)\.\^\(])/g, "\\$1"), "g"), " <img alt='" + k + "' title='" + k + "' src='https://static-cdn.jtvnw.net/emoticons/v1/" + TWKappa.Emotes.Twitch.storage.emotes[k].image_id + "/1.0' />");

                //Winter
                if (new Date().getMonth() === 11)
                    for (var k in TWKappa.Emotes.Extra.storage.winter)
                        m = m.replace(new RegExp("(^|\\s)" + k.replace(/([\)\.\^\(])/g, "\\$1"), "g"), " <img alt='" + k + "' title='" + k + "'src='" + TWKappa.Emotes.Extra.storage.winter[k].src + "' style='" + TWKappa.Emotes.Extra.storage.winter[k].style + "' />");

                return oldfunc(m);
            }
        }
    },
    init: function() {
        TWKappa.Emotes.Twitch.init();
        TWKappa.Emotes.Extra.init();
        TWKappa.Icon.init();
        TWKappa.LocalStorage.init();
        TWKappa.GameInject.parser();
        TWKappa.Window.RegisterWestApi();
        if (new Date().getMonth() === 11)
            $('head').append("<style>div.tw2gui_window.chat .chat_text { overflow:visible; }</style>")
    }
}

TWKappa.init();