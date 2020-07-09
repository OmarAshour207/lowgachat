function changeUserStatus(class1, class2)
{
    var user_status = ['online', 'offline', 'dnd', 'bys'];
    $.each(user_status, function (key, value) {
        $('.' + class1).removeClass(value);
    });
    $('.' + class1).addClass(class2);
}


$(document).ready(function(){

    var mylist = [];

    $('.user').each(function () {
        var uid = $(this).attr('uid');
        mylist.push(uid);
    });

    var changed_status = $('.current_status').attr('status');

    var socket = io.connect('http://lowga-chat.devel:5000',{
        query:'user_id='+user_id+'&username='+username+'&mylist='+mylist.join(',')+'&status='+changed_status
    });


    socket.on('is_online', function (data) {
        changeUserStatus(data.user_id, data.status);
        // ajax request to save the status in the database
    });

    socket.on('iam_online', function (data) {
        changeUserStatus(data.user_id, data.status);
    });

    socket.on('iam_offline', function (data) {
        changeUserStatus(data.user_id, data.status);
    });

    socket.on('new_status', function (data) {
        changeUserStatus(data.user_id, data.status)
    });

    socket.on('request_status', function (data) {
        socket.emit('response_status', {
            to_user_id: data.user_id,
            status: $('.current_status').attr('status')
        });
    });


    // to get online Users
    socket.on('connect', function (data) { // fire
        $('.user').each(function () { // get all the users in the friend list
            var uid = $(this).attr('uid');
            socket.emit('check_online', { // fire check_online emit to know who is connected (online)
                user_id: 'user_' + uid
            });
        });
    });

    // to change users Status
    $(document).on('click', '.status', function () {
        var changed_status = $(this).attr('status');
        $('.current_status').attr('status', changed_status);
        if (changed_status == 'dnd') {
            $('.current_status').text('don\'t Disturb');
        } else if (changed_status == 'bys') {
            $('.current_status').text('Busy');
        } else {
            $('.current_status').text(changed_status);
        }
        socket.emit('change_status', {
            status: changed_status
        });
    });

    var arr = []; // List of users

    $(document).on('click', '.msg_head', function() {
        var chatbox = $(this).parents().attr("rel") ;
        $('[rel="'+chatbox+'"] .msg_wrap').slideToggle('slow');
        return false;
    });

    $(document).on('click', '.close', function() {
        var chatbox = $(this).parents().parents().attr("rel") ;
        $('[rel="'+chatbox+'"]').hide();
        arr.splice($.inArray(chatbox, arr), 1);
        displayChatBox();
        return false;
    });

    function private_chatbox(username, userID)
    {
        if ($.inArray(userID, arr) != -1) {
            arr.splice($.inArray(userID, arr), 1);
        }

        arr.unshift(userID);
        chatPopup =  '<div class="msg_box box'+userID+'"  style="right:270px" rel="'+ userID+'">'+
            '<div class="msg_head">'+username +
            '<div class="close">x</div> </div>'+
            '<div class="msg_wrap"> <div class="msg_body">	<div class="msg_push"></div> </div>'+
            '<div class="msg_footer"><span class="broadcast"></span><textarea class="msg_input" rows="4"></textarea></div> 	</div> 	</div>' ;

        $("body").append(chatPopup);
        displayChatBox();
    }

    $(document).on('click', '#sidebar-user-box', function() {

        var userID = $(this).attr("uid");
        var username = $(this).children().text() ;

        private_chatbox(username, 'user_'+userID);
    });

    socket.on('new_private_message', function (data) {

        if(!$('.msg_box').hasClass('box'+data.from_uid)) {
            private_chatbox(data.username, data.from_uid);
        }
        $('.box'+data.from_uid+' .broadcast').html('');

        if (data.sender == 'user_' + user_id) {
            var msgDirection = 'msg-right';
        } else {
            var msgDirection = 'msg-left';
        }

        $('<div class="'+msgDirection+'">'+data.username+':'+data.message+'</div>').insertBefore('[rel="'+data.from_uid+'"] .msg_push');
        $('.msg_body').scrollTop($('.msg_body')[0].scrollHeight);
    });

    $(document).on('keypress', 'textarea' , function(e) {

        var chatbox = $(this).parents().parents().parents().attr("rel") ;

        if (e.keyCode == 13 ) {
            var msg = $(this).val();
            $(this).val('');

            if(msg.trim().length != 0){

                socket.emit('send_private_message', {
                    message: msg,
                    to_uid:chatbox
                });
            }
        } else {
            socket.emit('private_broadcast', {
                to:chatbox,
                username:username
            });
        }
    });

    socket.on('new_broadcast', (data) => {
        $('.box'+data.from_uid+' .broadcast').html('<span style="font-size:10px;float:left">'+data.username+'</span> <img class="pull-right" src="'+typing_url+'" />');

        setTimeout(function(){
            $('.box'+data.from_uid+' .broadcast').html('');
        }, 5000);
    });

    function displayChatBox(){
        i = 270 ; // start position
        j = 260;  //next position

        $.each( arr, function( index, value ) {
            if(index < 4){
                $('[rel="'+value+'"]').css("right",i);
                $('[rel="'+value+'"]').show();
                i = i+j;
            }
            else{
                $('[rel="'+value+'"]').hide();
            }
        });
    }


});
