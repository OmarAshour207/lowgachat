<?php

app()->bind('path.public', function (){
    return __DIR__;
});

Route::get('/', function () {
    return view('welcome');
});

Auth::routes();

Route::get('/home', 'HomeController@index')->name('home');
